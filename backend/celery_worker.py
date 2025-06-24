from celery import Celery

celery = Celery(
    'tasks',
    broker='redis://localhost:6379/0',  # Use your Render Redis URL in production
    backend='redis://localhost:6379/0'
)

@celery.task(bind=True)
def process_pdf_task(self, file_path):
    from statement_parser import analyze_pdf_statement
    result = analyze_pdf_statement(file_path)
    return result 