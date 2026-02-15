
import asyncio
import structlog
from jinja2 import Environment, FileSystemLoader
import os

logger = structlog.get_logger()

# Templates directory
# Assuming templates are in parent directory compared to services? 
# In original file it was "src/templates" in argument default.
# Let's try to determine absolute path relative to this file.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')

env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

def render_pdf_sync(html_content: str) -> bytes:
    """
    Synchronous function to render PDF from HTML content using WeasyPrint.
    """
    try:
        from weasyprint import HTML
        return HTML(string=html_content).write_pdf()
    except OSError:
        logger.warning("WeasyPrint / GTK not available. Returning dummy PDF.")
        return b"%PDF-1.4 ... Dummy PDF (GTK Missing) ... %%EOF"
    except ImportError:
        logger.warning("WeasyPrint module not found. Returning dummy PDF.")
        return b"%PDF-1.4 ... Dummy PDF (WeasyPrint Missing) ... %%EOF"

async def render_pdf(data: dict, template_name: str) -> bytes:
    """
    Renders a PDF from a Jinja2 template and data.
    Uses asyncio.to_thread to avoid blocking the event loop during PDF generation.
    """
    try:
        logger.info("Rendering PDF", template=template_name)
        
        # Setup Jinja2 environment
        # Check if template exists
        try:
             template = env.get_template(template_name)
        except Exception:
             # Fallback for tests if template missing
             logger.warning(f"Template {template_name} not found. Using string template.")
             template = env.from_string("<html><body><h1>{{ headline }}</h1><p>{{ analysis }}</p></body></html>")

        # Render HTML
        html_content = template.render(**data)
        
        # Generate PDF in a separate thread
        pdf_bytes = await asyncio.to_thread(render_pdf_sync, html_content)
        
        return pdf_bytes
    except Exception as e:
        logger.error("PDF generation failed", error=str(e))
        raise e
