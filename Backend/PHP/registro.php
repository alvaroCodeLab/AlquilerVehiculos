<?php

// ❌ SOLO DESARROLLO (en producción dejar en 0)
ini_set('display_errors', 0);
error_reporting(0);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';

require 'config.php';

session_start();
header('Content-Type: application/json');

// ✅ Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// ✅ Leer JSON
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos'
    ]);
    exit;
}

// ✅ Validación campos obligatorios
$requiredFields = ['nombre', 'primerApellido', 'email', 'password'];

foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        echo json_encode([
            'success' => false,
            'message' => "Falta el campo: $field"
        ]);
        exit;
    }
}

// ✅ Sanitizar datos
$nombre = trim($data['nombre']);
$primerApellido = trim($data['primerApellido']);
$segundoApellido = trim($data['segundoApellido'] ?? '');
$email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
$telefono = trim($data['telefono'] ?? '');
$direccion = trim($data['direccion'] ?? '');
$password = $data['password'];

if (!$email) {
    echo json_encode([
        'success' => false,
        'message' => 'Email no válido'
    ]);
    exit;
}

// ✅ Comprobar si el email existe
$stmt = $conn->prepare("SELECT 1 FROM usuarios WHERE email = ?");
if (!$stmt) {
    error_log("SELECT ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}

$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'message' => 'El email ya está registrado'
    ]);
    exit;
}

// ✅ Hash contraseña
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

// ✅ Insertar usuario
$stmt = $conn->prepare("
    INSERT INTO usuarios 
    (nombre, primer_apellido, segundo_apellido, email, password, telefono, direccion, rol) 
    VALUES (?, ?, ?, ?, ?, ?, ?, 'cliente')
");

if (!$stmt) {
    error_log("INSERT ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}

$stmt->bind_param(
    "sssssss",
    $nombre,
    $primerApellido,
    $segundoApellido,
    $email,
    $passwordHash,
    $telefono,
    $direccion
);

// =======================
// 🚀 REGISTRO OK
// =======================
if ($stmt->execute()) {

    // =======================
    // ✉️ EMAIL PROFESIONAL
    // =======================
    try {

        $mail = new PHPMailer(true);

        $mail->isSMTP();
        $mail->Host = $SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = $SMTP_USER;
        $mail->Password = $SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $SMTP_PORT;

        $mail->setFrom($SMTP_USER, 'RodaVía');
        $mail->addAddress($email, $nombre);

        $mail->isHTML(true);
        $mail->Subject = 'Bienvenido a RodaVía - Registro completado';

        $safeNombre = htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');

        $mail->Body = "
        <div style='font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4; padding: 30px;'>
            
            <div style='max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);'>
                
                <h2 style='color: #2B7A78; text-align: center; margin-bottom: 20px;'>
                    ¡Bienvenido a RodaVía, $safeNombre!
                </h2>

                <p style='font-size: 16px; color: #333; line-height: 1.6;'>
                    Tu registro se ha realizado correctamente 🎉
                </p>

                <p style='font-size: 16px; color: #555; line-height: 1.6;'>
                    A partir de ahora podrás:
                </p>

                <ul style='font-size: 15px; color: #555; line-height: 1.8; padding-left: 20px;'>
                    <li>🚗 Reservar vehículos fácilmente</li>
                    <li>📅 Consultar tus viajes y reservas</li>
                    <li>💸 Recibir ofertas y promociones exclusivas</li>
                    <li>⭐ Guardar tus vehículos favoritos</li>
                </ul>

                <p style='font-size: 16px; color: #333; margin-top: 20px;'>
                    Gracias por confiar en nosotros 🚗💨
                </p>

                <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>

                <p style='font-size: 12px; color: #999; text-align: center;'>
                    Este correo ha sido enviado automáticamente. Por favor, no respondas a este mensaje.
                </p>

            </div>

        </div>
        ";

        $mail->send();

    } catch (Exception $e) {
        error_log("MAIL ERROR: " . $mail->ErrorInfo);
    }

    echo json_encode(['success' => true]);

} else {

    error_log("DB ERROR: " . $conn->error);

    echo json_encode([
        'success' => false,
        'message' => 'Error al registrar usuario'
    ]);
}

$stmt->close();
$conn->close();
exit;