<?php
session_start();
require __DIR__ . '/../config.php';
if (empty($_SESSION['admin_logged'])) {
    header('Location: login.php');
    exit;
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <?php if (!empty($_SESSION['csrf_token'])): ?>
  <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
  <?php endif; ?>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin Dashboard - RodaVía</title>
  <link rel="stylesheet" href="/Proyecto_Vehiculos/Frontend/CSS/admin.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="admin-body">
  <aside class="sidebar">
    <div class="sidebar-brand">RodaVía Admin</div>
    <nav>
      <a href="#" data-section="dashboard" class="active">Dashboard</a>
      <a href="#" data-section="vehicles">Gestión de Vehículos</a>
      <a href="#" data-section="reservas">Gestión de Reservas</a>
      <a href="#" data-section="users">Gestión de Usuarios</a>
      <a href="#" data-section="estadisticas">Estadísticas</a>
      <a href="logout.php" class="logout">Cerrar sesión</a>
    </nav>
  </aside>
  <main class="main">
    <header class="main-header">
      <h1>Dashboard</h1>
      <div id="top-notifications"></div>
    </header>

    <section id="section-dashboard" class="section active">
      <div class="cards">
        <div class="card">Vehículos: <span id="count-vehicles">...</span></div>
        <div class="card">Usuarios: <span id="count-users">...</span></div>
        <div class="card">Reservas: <span id="count-reservas">...</span></div>
      </div>
      <div class="charts">
        <canvas id="chartIncome" height="120"></canvas>
      </div>
    </section>

    <section id="section-vehicles" class="section">
      <h2>Gestión de Vehículos</h2>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div>
          <button id="btn-add-vehicle" class="btn-primary">Agregar vehículo</button>
        </div>
        <div><small>Use el formulario para crear o editar vehículos.</small></div>
      </div>
      <div id="vehicles-list">Cargando...</div>
    </section>

    <section id="section-reservas" class="section">
      <h2>Gestión de Reservas</h2>
      <div id="reservas-list">Cargando reservas...</div>
    </section>

    <section id="section-users" class="section">
      <h2>Gestión de Usuarios</h2>
      <div id="users-list">Cargando...</div>
    </section>

    <section id="section-estadisticas" class="section">
      <h2>Estadísticas</h2>
      <div id="stats-area">Cargando...</div>
    </section>
  </main>

  <script src="/Proyecto_Vehiculos/Frontend/JS/admin.js"></script>
  <!-- Modal para crear/editar vehículo -->
  <div id="veh-modal" class="modal" style="display:none">
    <div class="modal-dialog">
      <header class="modal-header"><h3 id="veh-modal-title">Nuevo vehículo</h3><button id="veh-close">×</button></header>
      <form id="veh-form" enctype="multipart/form-data">
        <input type="hidden" name="id" id="veh-id">
        <div class="modal-body">
          <label>Marca<br><input name="marca" id="veh-marca" required></label>
          <label>Modelo<br><input name="modelo" id="veh-modelo" required></label>
          <label>Año<br><input name="anio" id="veh-anio" type="number"></label>
          <label>Matrícula<br><input name="matricula" id="veh-matricula"></label>
          <label>Precio/día<br><input name="precio_dia" id="veh-precio" type="number" step="0.01"></label>
          <label>Categoría (id)<br><input name="id_categoria" id="veh-cat" type="number"></label>
          <label>Estado<br><select name="estado" id="veh-estado"><option value="disponible">disponible</option><option value="ocupado">ocupado</option><option value="mantenimiento">mantenimiento</option></select></label>
          <label>Descripción<br><textarea name="descripcion" id="veh-desc"></textarea></label>
          <label>Imagen<br><input type="file" name="imagen" id="veh-imagen" accept="image/*"></label>
          <div id="veh-image-preview" style="grid-column:1 / -1;display:flex;gap:12px;align-items:center">
            <div style="min-width:120px;min-height:80px;border:1px solid #eee;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#fafafa">
              <img id="veh-preview-img" src="" alt="Preview" style="max-width:100%;max-height:100%;display:none">
              <span id="veh-preview-empty" style="color:#999;font-size:13px">No hay imagen</span>
            </div>
            <div><small id="veh-preview-filename"></small></div>
          </div>
        </div>
        <footer class="modal-footer"><button type="submit" class="btn-primary">Guardar</button> <button type="button" id="veh-cancel">Cancelar</button></footer>
      </form>
    </div>
  </div>
  <!-- Contenedor de toasts -->
  <div id="toast-container" aria-live="polite" aria-atomic="true"></div>
</body>
</html>
