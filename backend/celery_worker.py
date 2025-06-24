import os
from celery import Celery

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery = Celery(
    'tasks',
    broker=REDIS_URL,
    backend=REDIS_URL
)

@celery.task(bind=True)
def process_pdf_task(self, file_path):
    from statement_parser import analyze_pdf_statement
    result = analyze_pdf_statement(file_path)
    return result 