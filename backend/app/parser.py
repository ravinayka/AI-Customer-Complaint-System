import io
from pypdf import PdfReader
from docx import Document

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text from PDF, DOCX, or TXT file bytes.
    Raises ValueError for unsupported or invalid files.
    """
    ext = filename.split(".")[-1].lower()
    
    if ext == "txt":
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return file_bytes.decode("latin-1")
            except Exception as e:
                raise ValueError(f"Failed to decode text file: {str(e)}")
                
    elif ext == "pdf":
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            if not text.strip():
                raise ValueError("PDF contains no extractable text.")
            return text
        except Exception as e:
            raise ValueError(f"Failed to parse PDF file: {str(e)}")
            
    elif ext in ["docx", "doc"]:
        try:
            docx_file = io.BytesIO(file_bytes)
            doc = Document(docx_file)
            text = ""
            for para in doc.paragraphs:
                text += para.text + "\n"
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text += cell.text + " "
                    text += "\n"
            if not text.strip():
                raise ValueError("DOCX contains no extractable text.")
            return text
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX file: {str(e)}")
            
    else:
        raise ValueError(f"Unsupported file format: {ext}. Only PDF, DOCX, and TXT are supported.")
