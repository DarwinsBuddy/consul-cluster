import fs from 'fs'
const clientCert = fs.readFileSync('./client.pem', 'utf-8');
const clientKey = fs.readFileSync('./client.key.pem', 'utf-8');
const caCert = fs.readFileSync('./ca-bundle.pem', 'utf-8');

export const target = {
    protocol: 'https:',
    host:     'localhost',
    port:   8500,
    ca: caCert,
    cert: clientCert,
    key: clientKey
}