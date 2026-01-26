<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';

include('config.php');
session_start();

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$nombre = $data['nombre'];
$primerApellido = $data['primerApellido'];
$segundoApellido = $data['segundoApellido'];
$email = $data['email'];
$telefono = $data['telefono'];
$direccion = $data['direccion'];
$password = $data['password'];

$sql = "SELECT * FROM usuarios WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'message' => 'El email ya está registrado.'
    ]);
    exit;
}

// Encriptar la contraseña
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

//Insertar usuario en la base de datos
$sql = "INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, email, telefono, direccion, password, rol) VALUES (?, ?, ?, ?, ?, ?, ?, 'cliente')";

$stmt = $conn->prepare($sql);

$stmt->bind_param("sssssss", $nombre, $primerApellido, $segundoApellido, $email, $telefono, $direccion, $passwordHash);

// Ejecutar e informar
if ($stmt->execute()) {

    // ---------------------------------------------
    //  ENVIAR CORREO DE CONFIRMACIÓN
    // ---------------------------------------------
    $mail = new PHPMailer(true);

    try {
        // SERVIDOR SMTP
        $mail->isSMTP();
        $mail->Host = getenv('SMTP_HOST');
        $mail->SMTPAuth = true;
        $mail->Username = getenv('SMTP_USER');
        $mail->Password = getenv('SMTP_PASS');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = getenv('SMTP_PORT');

        // REMITENTE
        $mail->setFrom(getenv('SMTP_USER'), 'RodaVía - Registro');

        // DESTINATARIO
        $mail->addAddress($email, $nombre);

        // IMAGEN EN EL CORREO 
        $mail->addEmbeddedImage('../../SRC/IMG/logoRodaVía-removebg-preview.png', 'logo');

        // CONTENIDO HTML DEL CORREO
        $mail->isHTML(true);
        $mail->Subject = 'Confirmación de Registro | RodaVía';
        $mail->Body = "
            <div style='font-family: Arial; padding: 20px;'>
                <img src='cid:logo' style='width: 150px; margin-bottom: 20px;'>

                <h2 style='color: #2B7A78;'>¡Bienvenido a RodaVía, $nombre!</h2>

                <p>Tu registro se ha realizado correctamente.</p>

                <p>A partir de ahora podrás reservar vehículos, ver tus viajes, 
                recibir ofertas y mucho más.</p>

                <p>Gracias por confiar en nosotros 🚗💨</p>

                <hr style='margin-top: 30px;'>
                <p style='font-size: 12px; color: #999;'>Este correo es automático. Por favor, no respondas.</p>
            </div>
        ";

        $mail->send();

        echo json_encode(['success' => true]);
    } catch (Exception $e) {

        echo json_encode([
            'success' => false,
            'message' => 'Usuario creado, pero hubo un problema enviando la confirmación: ' . $mail->ErrorInfo
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error al registrar el usuario: ' . $conn->error
    ]);
}

$stmt->close();
$conn->close();
