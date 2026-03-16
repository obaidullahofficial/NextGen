import os
import glob
import re

files = glob.glob('frontend/src/pages/admin/*.jsx')

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make absolute sure tables have min-w-[900px] or min-w-[1000px] wrapped inside overflow-x-auto
    def replace_table(m):
        cls = m.group(1)
        cls = re.sub(r'\bw-full\b', '', cls)
        cls = re.sub(r'\bmin-w-\[?.*?\]?\b', '', cls)
        cls = re.sub(r'\bmax-w-none\b', '', cls)
        cls = re.sub(r'\bmin-w-max\b', '', cls)
        cls = re.sub(r'\s+', ' ', cls).strip()
        return '<table className="w-full min-w-[900px] max-w-none text-left ' + cls + '"'

    content = re.sub(r'<table className="([^"]*)"', replace_table, content)
    
    # Also fix some search inputs if they didn't catch 
    def replace_inputs(m):
        cls = m.group(1)
        # Avoid duplicating
        if 'w-full md:w-' in cls:
             return 'className="' + cls + '"'
        cls = re.sub(r'\bw-(64|72|80|96)\b', r'w-full md:w-\1 max-w-full', cls)
        return 'className="' + cls + '"'
        
    content = re.sub(r'className="([^"]*\b(?:w-64|w-72|w-80|w-96)\b[^"]*)"', replace_inputs, content)

    # Convert h-screen to min-h-screen for flexible height
    content = content.replace('className="min-h-screen flex items-center justify-center"', 'className="min-h-screen flex items-center justify-center"') # preserve
    content = content.replace('h-screen', 'min-h-screen')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
