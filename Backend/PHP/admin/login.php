<?php
session_start();
require __DIR__ . '/../config.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        $error = 'Completa todos los campos.';
    } else {
        $stmt = $conn->prepare('SELECT id_usuario, password, rol FROM usuarios WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) {
            $hash = $row['password'];
            $rol = $row['rol'];
            $ok = false;
            // Intenta verificar password hashed, si falla compara plan (compatibilidad)
            if (password_verify($password, $hash)) {
                $ok = true;
            } elseif ($password === $hash) {
                $ok = true;
            }

            if ($ok && $rol === 'administrador') {
                $_SESSION['admin_logged'] = true;
                $_SESSION['admin_id'] = $row['id_usuario'];
              // generar token CSRF para el admin
              try {
                $_SESSION['csrf_token'] = bin2hex(random_bytes(24));
              } catch (Exception $e) {
                $_SESSION['csrf_token'] = bin2hex(openssl_random_pseudo_bytes(24));
              }
                header('Location: index.php');
                exit;
            } else {
                $error = 'Credenciales inválidas o sin permisos de administrador.';
            }
        } else {
            $error = 'Usuario no encontrado.';
        }
    }
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin Login - RodaVía</title>
  <link rel="stylesheet" href="/Proyecto_Vehiculos/Frontend/CSS/admin.css">
</head>
<body class="admin-login-body">
  <main class="login-card">
    <h1>RodaVía — Admin</h1>
    <?php if ($error): ?>
      <div class="alert error"><?php echo htmlspecialchars($error); ?></div>
    <?php endif; ?>
    <form method="post" action="">
      <label>Email</label>
      <input type="email" name="email" required>
      <label>Password</label>
      <input type="password" name="password" required>
      <button type="submit">Entrar</button>
    </form>
  </main>
</body>
</html>
