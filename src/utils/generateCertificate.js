const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode"); // 🔥 ADD

exports.generateCertificate = async ({
    studentName,
    courseName,
    fileName,
    verificationId, // 🔥 ADD
}) => {
    const doc = new PDFDocument();

    const filePath = path.join(
        __dirname,
        `../public/certificates/${fileName}.pdf`
    );

    doc.pipe(fs.createWriteStream(filePath));

    // 🔗 verification URL
    const verifyUrl = `http://localhost:3000/verify/${verificationId}`;

    // 🔳 generate QR
    const qrImage = await QRCode.toDataURL(verifyUrl);

    // TITLE
    doc.fontSize(26).text("Certificate of Completion", {
        align: "center",
    });

    doc.moveDown();

    doc.fontSize(18).text("This is to certify that", {
        align: "center",
    });

    doc.moveDown();

    doc.fontSize(22).text(studentName, {
        align: "center",
    });

    doc.moveDown();

    doc.fontSize(16).text(
        "has successfully completed the course",
        { align: "center" }
    );

    doc.moveDown();

    doc.fontSize(20).text(courseName, {
        align: "center",
    });

    // 🔥 ADD QR CODE
    doc.moveDown();
    doc.image(Buffer.from(qrImage.split(",")[1], "base64"), {
        fit: [100, 100],
        align: "center",
    });

    doc.moveDown();

    doc.fontSize(10).text(`Verify: ${verifyUrl}`, {
        align: "center",
    });

    doc.end();

    return filePath;
};