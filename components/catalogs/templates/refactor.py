import os
import re

DIR = r"c:\Users\Mehme\.gemini\antigravity\scratch\katalog-app\components\catalogs\templates"

for filename in os.listdir(DIR):
    if not filename.endswith('.tsx') or filename in ['index.tsx', 'index.ts', 'catalog-template-renderer.tsx', 'utils.tsx', 'types.ts', 'types.tsx']:
        continue

    filepath = os.path.join(DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. Update imports
    if 'getStandardLogoHeight' not in content:
        content = re.sub(
            r'import\s+\{([^}]+)\}\s+from\s+["\']\./utils["\']',
            r'import { \1, getStandardLogoHeight, getHeaderLayout } from "./utils"',
            content
        )
    
    # 2. Extract out completely the `getLogoHeight = () => { switch (logoSize) ... }`
    content = re.sub(
        r'\s*const\s+(getLogoHeight|getLogoDimensions)\s*=\s*\(\)\s*=>\s*\{\s*switch\s*\(logoSize\)\s*\{\s*(case\s+\'\w+\'\s*:\s*return[^}]+)*default\s*:\s*return[^}]+\}\s*\}',
        '',
        content,
        flags=re.DOTALL
    )

    # 3. Replace the layout logic
    regex_layout = re.compile(
        r'\s*const\s+isHeaderLogo\s*=\s*logoPosition\?\.startsWith\(\'header\'\).*?'
        r'(?:const\s+logoAlignment[^\n]*\n)?'
        r'(?:.*?const\s+isCollisionLeft\s*=\s*[^\n]*\n)?'
        r'(?:.*?const\s+isCollisionCenter\s*=\s*[^\n]*\n)?'
        r'(?:.*?const\s+isCollisionRight\s*=\s*[^\n]*\n)?'
        r'(?:.*?const\s+isAnyCollision\s*=\s*[^\n]*\n)?',
        re.DOTALL
    )

    replacement = """
    const { isHeaderLogo, logoAlignment, titlePosition: finalTitlePosition, isCollisionLeft, isCollisionCenter, isCollisionRight, isAnyCollision } = getHeaderLayout(logoPosition, titlePosition)
    const logoHeight = getStandardLogoHeight(logoSize)
"""
    
    match = regex_layout.search(content)
    if match and "getHeaderLayout" not in content[match.start():match.end()]:
        content = content[:match.start()] + replacement + content[match.end():]

    # 4. Replace usages of getLogoHeight() with logoHeight
    content = content.replace("getLogoHeight()", "logoHeight")
    
    # Specific fix for files using destructured getLogoDimensions()
    content = content.replace("const { height, className } = getLogoDimensions()", "const height = logoHeight\n        const className = 'object-contain max-h-12 w-auto'")
    
    # Clean up double imports
    content = content.replace(", getStandardLogoHeight, getHeaderLayout, getStandardLogoHeight, getHeaderLayout", ", getStandardLogoHeight, getHeaderLayout")
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filename}")
    else:
        print(f"No changes made to {filename}")

EOF
