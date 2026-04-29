import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md

def parse_url(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    title = ""
    if soup.title:
        title = soup.title.string.strip()
    elif soup.h1:
        title = soup.h1.string.strip()
    else:
        title = url
        
    # Remove unwanted elements
    for element in soup(["script", "style", "nav", "footer", "aside"]):
        element.decompose()
        
    # Attempt to find main content
    main_content = soup.find('main') or soup.find('article') or soup.body
    
    markdown_content = f"# {title}\n\n"
    if main_content:
        content_md = md(str(main_content), heading_style="ATX")
        markdown_content += content_md.strip()
    else:
        markdown_content += "No content found."
        
    word_count = len(markdown_content.split())
    
    return markdown_content, title, word_count
