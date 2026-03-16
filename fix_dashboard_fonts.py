import os, re

file = 'frontend/src/pages/admin/dashboard.jsx'
with open(file, 'r', encoding='utf-8') as f:
    text = f.read()

def reduce_px(match):
    val = int(match.group(1))
    new_val = int(round(val * 0.9))
    return 'fontSize: "' + str(new_val) + 'px"'

def reduce_px_sq(match):
    val = int(match.group(1))
    new_val = int(round(val * 0.9))
    return "fontSize: '" + str(new_val) + "px'"

text = re.sub(r'fontSize:\s*\"(\d+)px\"', reduce_px, text)
text = re.sub(r"fontSize:\s*'(\d+)px'", reduce_px_sq, text)

with open(file, 'w', encoding='utf-8') as f:
    f.write(text)

print('Done')
