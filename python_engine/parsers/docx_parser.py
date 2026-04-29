import docx

def parse_docx(file_path):
    doc = docx.Document(file_path)
    text = []
    for para in doc.paragraphs:
        text.append(para.text)
        
    import os
    title = os.path.splitext(os.path.basename(file_path))[0]
    
    full_text = "\n\n".join(text)
    markdown_content = f"# {title}\n\n{full_text}"
    word_count = len(full_text.split())
    
    return markdown_content, title, word_count
