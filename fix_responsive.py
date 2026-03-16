import os
import glob
import re

files = glob.glob('frontend/src/pages/admin/*.jsx')
files.extend(glob.glob('frontend/src/components/admin/*.jsx'))

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply fixes:
    # 1. Flexible search inputs and modals (avoid fixed large widths)
    content = re.sub(r'\bw-80\b', 'w-full md:w-80 max-w-full', content)
    content = re.sub(r'\bw-96\b', 'w-full lg:w-96 max-w-full', content)
    content = re.sub(r'\bw-72\b', 'w-full md:w-72 max-w-full', content)
    
    # 2. Fix layout wrapping in headers and actions
    content = content.replace('flex items-center space-x-4', 'flex flex-wrap items-center gap-4')
    content = content.replace('flex flex-col md:flex-row justify-between items-center', 'flex flex-col md:flex-row flex-wrap justify-between items-center gap-4')
    content = content.replace('flex justify-between items-center', 'flex flex-wrap justify-between items-center gap-4')
    
    # 3. Ensure tables do not cause overlap by expanding their container safely
    content = content.replace('className="w-full text-left"', 'className="w-full min-w-[800px] max-w-none text-left"')
    content = content.replace('className="w-full"', 'className="w-full min-w-[800px] max-w-none"')
    
    # Check if table has an overflow wrapper. Almost all have <div className="overflow-x-auto">.
    # We just ensure the wrapper has max-w-full
    content = content.replace('className="overflow-x-auto"', 'className="overflow-x-auto w-full max-w-full"')
    content = content.replace('className="overflow-x-auto shadow-md rounded-lg"', 'className="overflow-x-auto w-full max-w-full shadow-md rounded-lg"')

    # 4. Overflow hidden container blocks sometimes hide the table scrollbar.
    content = re.sub(r'overflow-hidden(?!\s*flex|\s*w-)', 'overflow-hidden flex flex-col', content) # Trying not to break small components

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
