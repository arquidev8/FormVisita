const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config()

const nodemailer = require('nodemailer');
// Definir la carpeta de archivos estáticos
app.use(express.static('public'))

// Configurar Handlebars como motor de plantillas
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')

// Configurar Body Parser para recibir datos de formulario
app.use(bodyParser.json({ extended: true }))

// Renderizar la plantilla
app.get('/', (req, res) => {
  res.render('index')
})


app.get('/contrato.pdf', function(req, res){
  const filePath = path.join(__dirname, 'contrato.pdf');
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=contrato.pdf');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});


app.post('/generar-pdf', (req, res) => {
  try {
    // Recopilar la información del formulario y los canvas
    const referencia = req.body.referencia;
    const direccion = req.body.direccion;
    const poblacion = req.body.poblacion;
    const precio = req.body.precio;
    const nombre = req.body.nombre;
    const email = req.body.email;
    const pasaporte = req.body.pasaporte;
    const ciudad = req.body.ciudad;
    const pais = req.body.pais;
    const visita = req.body.visita;
    const agente = req.body.agente;
    const observaciones = req.body.observaciones;

    const imgData1 = req.body.imgData1; // Cambiar canvas por imgData1
    const imgData2 = req.body.imgData2;
    const fecha = new Date(visita);
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1; 
    const anio = fecha.getFullYear();
    const fechaFormateada = `${dia}/${mes}/${anio}`;


    const doc = new PDFDocument();

    doc.fontSize(11).font('Helvetica')
      .image('images/logo.png', 250, 15, {width: 130, align: 'center'})
      .text('PARTE DE VISITA / Visit Form', 100, 50, {align: 'center'})
      .text('IDENTIFICACIÓN INMUEBLE / Property Identification:', 100, 80, {align: 'center'})
      .text(`Ref. propiedad / Ref. Property: ${referencia}`, 100, 100)
      .text(`Dirección / Direction: ${direccion}`, 100, 120)
      .text(`Población / Population: ${poblacion}`, 100, 140)
      .text(`Precio / Price: ${precio}`, 100, 160)
      .text('IDENTIFICACIÓN CLIENTE INTERESADO / Interested client identification:', 100, 180, {align: 'center'})
      .text(`Nombre / Name: ${nombre}`, 100, 200)
      .text(`Correo / Email: ${email}`, 100, 220)
      .text(`DNI/Passport / DNI Pasaporte: ${pasaporte}`, 100, 240)
      .text(`Ciudad / City: ${ciudad}`, 100, 260)
      .text(`País / Country: ${pais}`, 100, 280)
      .text(`Certifico / I Certify:`, 100, 300)
      .text(`Que he visitado el inmueble identificado arriba por estar interesado/a en su posible adquisición. La firma del presente parte de visita, solo justifica que he visitado y recibido la información sobre el precio y las formas de pago. Me comprometo a no realizar ninguna gestión encaminada a comprar/arrendar sin la intervención del agente comercial que me ha enseñado la propiedad, por medio de apoderado, o por conducto de terceras personas el inmueble visitado ni a parientes en línea directa o colateral, para que sean ellos los que realicen la compraventa, evitando que intervenga el Agente Inmobiliario. / 
      
      I certify that I have visited the property identified above as I am interested in its potential acquisition. The signature on this visit document only confirms that I have visited and received information about the price and payment methods. I commit to not undertaking any actions aimed at buying/renting the visited property without the involvement of the commercial agent who showed me the property, either through a representative or through third parties, including direct or collateral relatives, so that they are the ones who carry out the purchase, thus avoiding the involvement of the Real Estate Agent.`, {align: 'justify'})
      .text(`OBSERVACIONES / OBSERVATIONS:`, 100, 515, {align: 'center'})
      .text(observaciones, 100, 530, {align: 'center'})
   
      .text(`Fecha de visita / Date of Visit: ${fechaFormateada}`, 100, 540, {align: 'center'})
      .image(imgData1, 270, 550, {width: 90, align: 'center'})
      .text(nombre, 100, 590, {align: 'center'})   
      .text('Firma / Signature', 100, 610, {align: 'center'})
    // doc.addPage();
    // doc.fontSize(11)
      .text('Agente Inmobiliario / Real Estate Agent:', 100, 625, {align: 'center'})   
      .image(imgData2, 270,  640, {width: 90, align: 'center'})
      .text(agente, 100, 685, {align: 'center'})
      .text('Firma / Signature', 100, 700, {align: 'center'})
    
    // Finalizar y guardar el archivo PDF
    doc.end();
    const filePath = path.join(__dirname, 'contrato.pdf');
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
  
    writeStream.on('finish', () => {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'login',
          user: 'partesdevisita@hannanpiper.com',
          pass: process.env.PASSWORD
        }
      });

      let mailOptions = {
        from: 'partesdevisita@hannanpiper.com',
        to: `${email}, partesdevisita@hannanpiper.com`,
        subject: 'Parte de Visita',
        text: `Estimado/a cliente:
        Aquí está su Parte de Visita realizada al inmueble ubicado en ${direccion}.
        Si está interesado/a en presentar una oferta por el mismo, puede comunicarse directamente con nombre del ${agente} o llamarnos al +34 931 59 58 80. 
        También puede escribirnos un mail a info@hannanpiper.com.
        Saludos,
        Hannan-Piper Real Estate`,
        attachments: [{
          filename: 'contrato.pdf',
          path: filePath
        }]
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          // console.log(error);
          res.sendStatus(500); // Error al enviar el correo con el PDF
        } else {
          // console.log('Email enviado: ' + info.response);

          // Redirigir al usuario a una ruta después de enviar el correo electrónico
          res.redirect('/exito');
        }
      });
    });
  } catch (err) {
    // console.error(err);
    res.sendStatus(500);
  }
});

app.get('/exito', (req, res) => {
  res.render('exito');
});


// Iniciar el servidor
app.listen(3000, () => console.log(''))
