FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "-c", "import uvicorn, os; uvicorn.run('server:app', host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))"]
