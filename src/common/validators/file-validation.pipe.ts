import { 
  PipeTransform, 
  Injectable, 
  ArgumentMetadata, 
  BadRequestException,
  Logger 
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly logger = new Logger(FileValidationPipe.name);
  private readonly maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
  private readonly allowedMimeTypes = ['application/pdf'];
  private readonly allowedExtensions = ['.pdf'];

  transform(files: Express.Multer.File[], metadata: ArgumentMetadata): Express.Multer.File[] {
    if (!files || !Array.isArray(files)) {
      return files;
    }

    // Máximo 3 archivos
    if (files.length > 3) {
      throw new BadRequestException('Máximo 3 archivos permitidos');
    }

    files.forEach((file, index) => {
      this.validateFile(file, index);
    });

    return files;
  }

  private validateFile(file: Express.Multer.File, index: number): void {
    // Validar que el archivo existe
    if (!file) {
      throw new BadRequestException(`Archivo en posición ${index} está vacío`);
    }

    // Sanitizar nombre de archivo
    const sanitizedName = this.sanitizeFilename(file.originalname);
    if (sanitizedName !== file.originalname) {
      this.logger.warn(`Nombre de archivo sanitizado: ${file.originalname} -> ${sanitizedName}`);
      file.originalname = sanitizedName;
    }

    // Validar extensión
    const extension = this.getFileExtension(file.originalname);
    if (!this.allowedExtensions.includes(extension.toLowerCase())) {
      throw new BadRequestException(
        `Archivo "${file.originalname}" tiene extensión no válida. Solo se permiten: ${this.allowedExtensions.join(', ')}`
      );
    }

    // Validar MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Archivo "${file.originalname}" tiene tipo MIME no válido: ${file.mimetype}. Solo se permiten PDFs.`
      );
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      const maxSizeMB = (this.maxFileSize / 1024 / 1024).toFixed(1);
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      throw new BadRequestException(
        `Archivo "${file.originalname}" (${fileSizeMB}MB) excede el tamaño máximo permitido de ${maxSizeMB}MB`
      );
    }

    // Validar que tiene contenido
    if (file.size === 0) {
      throw new BadRequestException(`Archivo "${file.originalname}" está vacío`);
    }

    this.logger.log(`Archivo validado: ${file.originalname} (${file.size} bytes)`);
  }

  private sanitizeFilename(filename: string): string {
    // Remover caracteres peligrosos y mantener solo letras, números, puntos, guiones y guiones bajos
    return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex);
  }
} 