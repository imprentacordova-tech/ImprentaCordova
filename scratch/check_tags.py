
import sys

def check_tags(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    depth = 0
    for i, line in enumerate(lines):
        # Very simple tag counting, won't handle nested same-line tags perfectly but helpful
        open_tags = line.count('<div') - line.count('<div') # Wait this is wrong
        
        # Proper count
        # Opening tags (not self-closing)
        open_count = 0
        idx = 0
        while True:
            idx = line.find('<div', idx)
            if idx == -1: break
            # Check if it's self-closing
            end_idx = line.find('>', idx)
            if end_idx != -1 and line[end_idx-1] == '/':
                pass # self-closing
            else:
                open_count += 1
            idx += 1
            
        close_count = line.count('</div>')
        
        old_depth = depth
        depth += open_count - close_count
        
        if open_count != 0 or close_count != 0:
            print(f"Line {i+1}: {line.strip()[:50]} | Open: {open_count}, Close: {close_count}, Depth: {depth}")
            
    print(f"Final depth: {depth}")

if __name__ == "__main__":
    check_tags(sys.argv[1])
