const fs = require('fs');
const ase = require('ase-utils');
const { colord, extend } = require('colord');
const labPlugin = require('colord/plugins/lab');

extend([labPlugin]);

const inputPath = 'TCX.ase'; 
const outputPath = 'pantone-tcx.json';

try {
  const buffer = fs.readFileSync(inputPath);
  const output = ase.decode(buffer);

  // We found from your debug that the data is in output.colors
  const rawColors = output.colors || [];

  const processed = rawColors.map(item => {
    const { model, color } = item;
    let hex = '#000000';
    let lab = { l: 0, a: 0, b: 0 };

    if (model === 'LAB' || model === 'Lab') {
      // In ASE/Adobe, L is 0-1, a and b are usually -128 to 128 (but normalized here)
      // Based on your egret (f3ece0), L should be around 96. 
      // So L = color[0] * 100
      lab = { 
        l: color[0] * 100, 
        a: color[1], 
        b: color[2] 
      };
      
      try {
        hex = colord(lab).toHex();
      } catch (e) {
        hex = '#cccccc'; // Fallback
      }
    }

    return {
      code: item.name.replace('PANTONE ', '').trim(),
      name: item.name,
      hex: hex,
      lab: lab
    };
  });

  if (processed.length === 0) {
    console.error('❌ Still no colors. Check if output.colors is truly empty.');
  } else {
    fs.writeFileSync(outputPath, JSON.stringify(processed, null, 2));
    console.log(`✅ Success! Extracted ${processed.length} colors.`);
    console.log(`Sample: ${processed[0].name} -> ${processed[0].hex}`);
  }

} catch (err) {
  console.error('❌ Critical Error:', err.message);
}