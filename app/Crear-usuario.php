<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

function respond(int $code, array $payload): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(405, ['ok' => false, 'error' => 'Método no permitido. Usa POST.']);
}

/* ==== CONFIG DB ==== */
$host = '34.45.106.213';
$db   = 'Documentos';
$user = 'root';
$pass = 'CardenasCorp2025';
$charset = 'utf8mb4';

/* ==== INPUT ==== */
// Soporta form-data o JSON
$raw  = file_get_contents('php://input');
$data = $_POST ?: (json_decode($raw, true) ?? []);

$usuario       = trim($data['usuario'] ?? '');
$passwordPlano = (string)($data['password'] ?? $data['contraseña'] ?? '');
$departamento  = strtoupper(trim($data['departamento'] ?? ''));

// Ajusta según tus departamentos válidos
$allowedDept = ['TAX', 'LEGAL', 'AUDITORIA', 'ADMIN'];

/* ==== VALIDACIONES BÁSICAS ==== */
if ($usuario === '' || mb_strlen($usuario) < 3 || mb_strlen($usuario) > 40) {
  respond(422, ['ok' => false, 'error' => '"usuario" requerido (3–40 caracteres).']);
}
if ($passwordPlano === '' || strlen($passwordPlano) < 8) {
  respond(422, ['ok' => false, 'error' => '"password" requerido (mínimo 8 caracteres).']);
}
if (!in_array($departamento, $allowedDept, true)) {
  respond(422, ['ok' => false, 'error' => '"departamento" inválido. Usa: ' . implode(', ', $allowedDept)]);
}

try {
  $pdo = new PDO(
    "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
    $dbUser,
    $dbPass,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
  );

  // Verifica duplicado por claridad (además del UNIQUE si lo tienes)
  $check = $pdo->prepare('SELECT 1 FROM usuarios WHERE usuario = :u LIMIT 1');
  $check->execute([':u' => $usuario]);
  if ($check->fetch()) {
    respond(409, ['ok' => false, 'error' => 'El usuario ya existe.']);
  }

  // Hash bcrypt cost 12 (igual que tus filas actuales $2y$12$…)
  $hash = password_hash($passwordPlano, PASSWORD_BCRYPT, ['cost' => 12]);

  // Nota: la columna se llama `contraseña`, con ñ. Usa backticks.
  $stmt = $pdo->prepare('
    INSERT INTO usuarios (`usuario`, `contraseña`, `departamento`, `fecha_creacion`)
    VALUES (:u, :h, :d, NOW())
  ');
  $stmt->execute([
    ':u' => $usuario,
    ':h' => $hash,
    ':d' => $departamento,
  ]);

  respond(201, [
    'ok'          => true,
    'id_usuario'  => (int)$pdo->lastInsertId(),
    'usuario'     => $usuario,
    'departamento'=> $departamento
  ]);

} catch (PDOException $e) {
  // 1062 = duplicado si tienes UNIQUE(usuario)
  if ((int)($e->errorInfo[1] ?? 0) === 1062) {
    respond(409, ['ok' => false, 'error' => 'El usuario ya existe (duplicado).']);
  }
  respond(500, ['ok' => false, 'error' => 'Error de base de datos', 'codigo' => $e->getCode()]);
}
