
DROP DATABASE IF EXISTS randevular;

CREATE DATABASE randevular;


USE randevular;


CREATE TABLE randevular (
    id INT AUTO_INCREMENT PRIMARY KEY,
    isim VARCHAR(50) NOT NULL,
    soyisim VARCHAR(50) NOT NULL,
    telefon VARCHAR(15) NOT NULL,
    tarih DATE NOT NULL,
    saat TIME NOT NULL
);
