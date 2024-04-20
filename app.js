const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // MySQL şifreniz
    database: 'siker'
});

connection.connect((err) => {
    if (err) {
        console.error('MySQL bağlantısı başarısız: ' + err.stack);
        return;
    }
    console.log('MySQL bağlantısı başarılı, ID: ' + connection.threadId);

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS randevular (
            id INT AUTO_INCREMENT PRIMARY KEY,
            isim VARCHAR(50) NOT NULL,
            soyisim VARCHAR(50) NOT NULL,
            telefon VARCHAR(15) NOT NULL,
            tarih DATE NOT NULL,
            saat TIME NOT NULL
        )
    `;
    connection.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Randevular tablosu oluşturulamadı: ' + err.message);
        } else {
            console.log('Randevular tablosu oluşturuldu.');
        }
    });
});

app.get('/', (req, res) => {
    fs.readFile('index.html', 'utf8', (err, data) => {
        if (err) {
            console.error('Dosya okunamadı: ' + err);
            res.status(500).send('Sayfa bulunamadı.');
            return;
        }
        connection.query('SELECT * FROM randevular ORDER BY tarih, saat', (err, rows) => {
            if (err) {
                console.error('MySQL hatası: ' + err.message);
                res.status(500).send('Randevular getirilemedi.');
                return;
            }
            let randevuRows = '';
            rows.forEach((randevu, index) => {
                const tarih = new Date(randevu.tarih).toLocaleDateString('tr-TR');
                const saat = new Date(`1970-01-01T${randevu.saat}`).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
                randevuRows += `
                    <tr>
                        <th scope="row">${index + 1}</th>
                        <td>${randevu.isim}</td>
                        <td>${randevu.soyisim}</td>
                        <td>${randevu.telefon}</td>
                        <td>${tarih} ${saat}</td>
                        <td><button type="button" class="btn btn-danger" onclick="removeRandevu(${randevu.id})">&times;</button></td>
                    </tr>
                `;
            });
            const updatedHTML = data.replace('{{randevuRows}}', randevuRows).replace('{{uyariKutusu}}', '');
            res.send(updatedHTML);
        });
    });
});

app.post('/randevu', (req, res) => {
    const { isim, soyisim, telefon, tarih, saat } = req.body;
    connection.query('SELECT * FROM randevular WHERE tarih = ? AND saat = ?', [tarih, saat], (err, rows) => {
        if (err) {
            console.error('MySQL hatası: ' + err.message);
            res.status(500).send('Veritabanı hatası.');
        } else {
            if (rows.length === 0) {
                connection.query('INSERT INTO randevular (isim, soyisim, telefon, tarih, saat) VALUES (?, ?, ?, ?, ?)', [isim, soyisim, telefon, tarih, saat], (err, result) => {
                    if (err) {
                        console.error('MySQL hatası: ' + err.message);
                        res.status(500).send('Randevu oluşturulamadı.');
                    } else {
                        console.log('Yeni randevu oluşturuldu, ID: ' + result.insertId);
                        res.redirect('/');
                    }
                });
            } else {
                const uyariKutusu = `
                    <div class="alert alert-warning uyari-kutusu" role="alert">
                        Belirtilen tarih ve saatte başka bir randevu bulunmaktadır.
                    </div>
                `;
                fs.readFile('index.html', 'utf8', (err, data) => {
                    if (err) {
                        console.error('Dosya okunamadı: ' + err);
                        res.status(500).send('Sayfa bulunamadı.');
                        return;
                    }
                    connection.query('SELECT * FROM randevular ORDER BY tarih, saat', (err, rows) => {
                        if (err) {
                            console.error('MySQL hatası: ' + err.message);
                            res.status(500).send('Randevular getirilemedi.');
                            return;
                        }
                        let randevuRows = '';
                        rows.forEach((randevu, index) => {
                            const tarih = new Date(randevu.tarih).toLocaleDateString('tr-TR');
                            const saat = new Date(`1970-01-01T${randevu.saat}`).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
                            randevuRows += `
                                <tr>
                                    <th scope="row">${index + 1}</th>
                                    <td>${randevu.isim}</td>
                                    <td>${randevu.soyisim}</td>
                                    <td>${randevu.telefon}</td>
                                    <td>${tarih} ${saat}</td>
                                    <td><button type="button" class="btn btn-danger" onclick="removeRandevu(${randevu.id})">&times;</button></td>
                                </tr>
                            `;
                        });
                        const updatedHTML = data.replace('{{randevuRows}}', randevuRows).replace('{{uyariKutusu}}', uyariKutusu);
                        res.send(updatedHTML);
                    });
                });
            }
        }
    });
});

app.delete('/randevu/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM randevular WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('MySQL hatası: ' + err.message);
            res.status(500).send('Randevu kaldırılamadı.');
        } else {
            console.log('Randevu kaldırıldı, ID: ' + id);
            res.sendStatus(200);
        }
    });
});

app.listen(port, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${port}`);
});
