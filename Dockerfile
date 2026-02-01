# Naudojame oficialų lengvą Python atvaizdą
FROM python:3.10-slim

# Nustatome darbinį aplanką konteinerio viduje
WORKDIR /app

# Nukopijuojame priklausomybių failą ir jas įdiegiame
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Nukopijuojame visą likusį kodą (main.py, index.html ir kt.)
COPY . .

# Nurodome, kurį prievadą (port) naudos aplikacija
EXPOSE 8000

# Paleidžiame FastAPI serverį
CMD ["uvicorn", "main.py:app", "--host", "0.0.0.0", "--port", "8000"]