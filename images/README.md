# Extension Icons

This folder should contain the following icon files for your Chrome Extension:

## Required Icon Files

### icon-16.png
- **Size**: 16x16 pixels
- **Usage**: Browser toolbar icon (small)
- **Description**: Small icon for browser action/page action

### icon-48.png
- **Size**: 48x48 pixels
- **Usage**: Extensions management page
- **Description**: Medium-sized icon shown in chrome://extensions

### icon-128.png
- **Size**: 128x128 pixels
- **Usage**: Chrome Web Store, installation dialog
- **Description**: Large icon for store listing and installation

## Creating Your Icons

To create your own icons, you can:

1. **Use an online icon generator**:
   - https://favicon.io/
   - https://realfavicongenerator.net/
   - https://www.favicon-generator.org/

2. **Create manually**:
   - Design in any graphics software (Photoshop, GIMP, Figma, etc.)
   - Save as PNG with transparency
   - Ensure proper dimensions for each size

3. **Use placeholder icons temporarily**:
   - Create simple colored squares or circles
   - Add a letter or number to identify your extension
   - Replace with professional icons before publishing

## Icon Design Guidelines

- **Format**: PNG with transparency support
- **Colors**: Use colors that stand out but match your extension's theme
- **Simplicity**: Icons should be recognizable at small sizes
- **Consistency**: All sizes should represent the same design
- **Contrast**: Ensure good visibility on both light and dark backgrounds

## Temporary Placeholder

For testing purposes, you can create simple placeholder icons:

```html
<!-- Simple HTML/CSS to create a placeholder icon -->
<div style="
    width: 128px;
    height: 128px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 25%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 48px;
    font-weight: bold;
">
    CE
</div>
```

Then screenshot and save at the required dimensions.

## Note

The extension will not load without these icon files. Create placeholder images or download sample icons to get started quickly.