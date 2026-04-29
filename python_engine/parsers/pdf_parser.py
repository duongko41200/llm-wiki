import pdfplumber

def parse_pdf(file_path):
    text = ""
    title = ""
    with pdfplumber.open(file_path) as pdf:
        if pdf.metadata and 'Title' in pdf.metadata and pdf.metadata['Title']:
            title = pdf.metadata['Title']
        else:
            import os
            title = os.path.splitext(os.path.basename(file_path))[0]
            
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n\n"
                
    markdown_content = f"# {title}\n\n{text}"
    word_count = len(text.split())
    
    return markdown_content, title, word_count
