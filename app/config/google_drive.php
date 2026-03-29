<?php
// config/google_drive.php

require_once __DIR__ . '/../vendor/autoload.php';

class GoogleDriveService {
    private $client;
    private $service;
    private $credentialsPath;
    private $tokenPath;
    private $rootFolderId = null; // Opcional: ID de carpeta raíz en Drive
    
    public function __construct() {
        $this->credentialsPath = __DIR__ . '/credentials.json';
        $this->tokenPath = __DIR__ . '/token.json';
        
        // Verificar que existan las credenciales
        if (!file_exists($this->credentialsPath)) {
            throw new Exception('Archivo credentials.json no encontrado en config/');
        }
        
        $this->initializeClient();
    }
    
    private function initializeClient() {
        $this->client = new Google_Client();
        $this->client->setApplicationName('Sistema de Gestión de Casos');
        $this->client->setScopes(Google_Service_Drive::DRIVE_FILE);
        $this->client->setAuthConfig($this->credentialsPath);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('select_account consent');
        
        // Configurar redirección (ajusta según tu dominio)
        $this->client->setRedirectUri('http://' . $_SERVER['HTTP_HOST'] . '/auth_google_drive.php');
    }
    
    /**
     * Verificar autenticación
     */
    public function isAuthenticated() {
        if (file_exists($this->tokenPath)) {
            $accessToken = json_decode(file_get_contents($this->tokenPath), true);
            $this->client->setAccessToken($accessToken);
            
            // Si el token expiró, intentar refrescar
            if ($this->client->isAccessTokenExpired()) {
                if ($this->client->getRefreshToken()) {
                    return $this->refreshToken();
                }
                return false;
            }
            return true;
        }
        return false;
    }
    
    /**
     * Refrescar token
     */
    private function refreshToken() {
        try {
            $this->client->fetchAccessTokenWithRefreshToken($this->client->getRefreshToken());
            $newToken = $this->client->getAccessToken();
            file_put_contents($this->tokenPath, json_encode($newToken));
            return true;
        } catch (Exception $e) {
            error_log("Error refrescando token: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Obtener URL de autenticación
     */
    public function getAuthUrl() {
        return $this->client->createAuthUrl();
    }
    
    /**
     * Manejar callback de autenticación
     */
    public function handleAuthCallback($code) {
        try {
            $accessToken = $this->client->fetchAccessTokenWithAuthCode($code);
            
            // Verificar errores
            if (isset($accessToken['error'])) {
                throw new Exception($accessToken['error_description'] ?? $accessToken['error']);
            }
            
            $this->client->setAccessToken($accessToken);
            
            // Guardar token
            file_put_contents($this->tokenPath, json_encode($accessToken));
            
            return $accessToken;
        } catch (Exception $e) {
            throw new Exception("Error en autenticación: " . $e->getMessage());
        }
    }
    
    /**
     * Crear carpeta en Drive
     */
    public function createFolder($name, $parentId = null) {
        if (!$this->isAuthenticated()) {
            throw new Exception('No autenticado con Google Drive');
        }
        
        $this->service = new Google_Service_Drive($this->client);
        
        $fileMetadata = new Google_Service_Drive_DriveFile([
            'name' => $this->sanitizeFileName($name),
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => $parentId ? [$parentId] : []
        ]);
        
        try {
            $folder = $this->service->files->create($fileMetadata, [
                'fields' => 'id, name, webViewLink, webContentLink'
            ]);
            
            // Hacer carpeta pública para ver
            $this->setFilePublic($folder->id);
            
            return [
                'success' => true,
                'id' => $folder->id,
                'name' => $folder->name,
                'viewUrl' => $folder->webViewLink,
                'downloadUrl' => $folder->webContentLink
            ];
        } catch (Exception $e) {
            error_log("Error creando carpeta: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Error al crear carpeta: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Subir archivo a Drive
     */
    public function uploadFile($filePath, $fileName, $parentId = null, $description = '') {
        if (!$this->isAuthenticated()) {
            throw new Exception('No autenticado con Google Drive');
        }
        
        if (!file_exists($filePath)) {
            throw new Exception('Archivo no encontrado: ' . $filePath);
        }
        
        $this->service = new Google_Service_Drive($this->client);
        
        $fileMetadata = new Google_Service_Drive_DriveFile([
            'name' => $this->sanitizeFileName($fileName),
            'description' => $description,
            'parents' => $parentId ? [$parentId] : []
        ]);
        
        $content = file_get_contents($filePath);
        $mimeType = mime_content_type($filePath);
        
        try {
            $file = $this->service->files->create($fileMetadata, [
                'data' => $content,
                'mimeType' => $mimeType,
                'uploadType' => 'multipart',
                'fields' => 'id, name, size, mimeType, webViewLink, webContentLink, thumbnailLink'
            ]);
            
            // Hacer archivo público
            $this->setFilePublic($file->id);
            
            return [
                'success' => true,
                'id' => $file->id,
                'name' => $file->name,
                'size' => $file->size,
                'type' => $file->mimeType,
                'viewUrl' => $file->webViewLink,
                'downloadUrl' => $file->webContentLink,
                'directDownload' => 'https://drive.google.com/uc?export=download&id=' . $file->id,
                'thumbnail' => $file->thumbnailLink
            ];
        } catch (Exception $e) {
            error_log("Error subiendo archivo: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Error al subir archivo: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Crear estructura completa para un caso
     */
    public function createCaseStructure($casoId, $numero, $empresa, $tipo) {
        // Nombre de carpeta principal
        $folderName = "Caso_{$casoId}_{$numero}_{$empresa}_{$tipo}";
        $folderName = $this->sanitizeFileName($folderName);
        
        // Crear carpeta principal
        $mainFolder = $this->createFolder($folderName, $this->rootFolderId);
        
        if (!$mainFolder['success']) {
            return $mainFolder;
        }
        
        // Crear subcarpetas organizadas
        $subfolders = [
            'documentos' => '01_Documentos_Principales',
            'evidencias' => '02_Evidencias',
            'respuestas' => '03_Respuestas_Oficios',
            'comunicaciones' => '04_Comunicaciones',
            'otros' => '05_Otros_Documentos'
        ];
        
        $structure = [
            'main' => $mainFolder,
            'subfolders' => []
        ];
        
        foreach ($subfolders as $key => $name) {
            $folder = $this->createFolder($name, $mainFolder['id']);
            if ($folder['success']) {
                $structure['subfolders'][$key] = $folder;
            }
        }
        
        // Crear archivo README
        $readmeContent = "# CASO: {$numero}\n\n";
        $readmeContent .= "**ID:** {$casoId}\n";
        $readmeContent .= "**Empresa:** {$empresa}\n";
        $readmeContent .= "**Tipo:** {$tipo}\n";
        $readmeContent .= "**Fecha Creación:** " . date('Y-m-d H:i:s') . "\n\n";
        $readmeContent .= "## Estructura:\n";
        $readmeContent .= "- 01_Documentos_Principales/: Requerimientos, notificaciones principales\n";
        $readmeContent .= "- 02_Evidencias/: Imágenes, documentos probatorios\n";
        $readmeContent .= "- 03_Respuestas_Oficios/: Respuestas a requerimientos\n";
        $readmeContent .= "- 04_Comunicaciones/: Correos, comunicaciones oficiales\n";
        $readmeContent .= "- 05_Otros_Documentos/: Documentación adicional\n";
        
        $tempFile = tempnam(sys_get_temp_dir(), 'readme_');
        file_put_contents($tempFile, $readmeContent);
        
        $this->uploadFile($tempFile, 'README.md', $mainFolder['id'], 'Información del caso');
        
        unlink($tempFile);
        
        return [
            'success' => true,
            'message' => 'Estructura creada exitosamente',
            'data' => $structure
        ];
    }
    
    /**
     * Hacer archivo/carpeta pública
     */
    private function setFilePublic($fileId) {
        try {
            $this->service = new Google_Service_Drive($this->client);
            
            $permission = new Google_Service_Drive_Permission([
                'type' => 'anyone',
                'role' => 'reader'
            ]);
            
            $this->service->permissions->create($fileId, $permission);
            return true;
        } catch (Exception $e) {
            // No es crítico si falla
            return false;
        }
    }
    
    /**
     * Sanitizar nombre de archivo
     */
    private function sanitizeFileName($name) {
        // Reemplazar caracteres no permitidos en Drive
        $name = preg_replace('/[<>:"\/\\|?*]/', '_', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        $name = trim($name);
        
        // Limitar longitud
        if (strlen($name) > 200) {
            $name = substr($name, 0, 200);
        }
        
        return $name;
    }
    
    /**
     * Obtener información de archivo
     */
    public function getFileInfo($fileId) {
        if (!$this->isAuthenticated()) {
            throw new Exception('No autenticado');
        }
        
        try {
            $this->service = new Google_Service_Drive($this->client);
            $file = $this->service->files->get($fileId, ['fields' => 'id, name, size, mimeType, webViewLink']);
            
            return [
                'success' => true,
                'id' => $file->id,
                'name' => $file->name,
                'size' => $file->size,
                'type' => $file->mimeType,
                'url' => $file->webViewLink
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
?>