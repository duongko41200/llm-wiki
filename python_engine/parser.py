import argparse
import json
import sys
import os
from parsers.pdf_parser import parse_pdf
from parsers.docx_parser import parse_docx
from parsers.web_crawler import parse_url

def main():
    parser = argparse.ArgumentParser(description="Document Parser for KnowledgeForge")
    parser.add_argument("--input", required=True, help="Input file path or URL")
    parser.add_argument("--type", required=True, choices=["pdf", "docx", "url"], help="Type of input")
    parser.add_argument("--output", required=True, help="Output markdown file path")
    
    args = parser.parse_args()
    
    try:
        if args.type == "pdf":
            markdown_content, title, word_count = parse_pdf(args.input)
        elif args.type == "docx":
            markdown_content, title, word_count = parse_docx(args.input)
        elif args.type == "url":
            markdown_content, title, word_count = parse_url(args.input)
        else:
            raise ValueError(f"Unsupported type: {args.type}")
            
        # Ensure output directory exists
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(markdown_content)
            
        print(json.dumps({
            "status": "ok",
            "output_path": args.output,
            "title": title,
            "word_count": word_count
        }))
        
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
