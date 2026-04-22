const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

/**
 * Base File Handler - Abstract class for file operations
 * Demonstrates: Encapsulation, Abstraction
 */
class BaseFileHandler {
  constructor(filePath) {
    this.filePath = filePath;
    this.ensureDirectory();
  }

  /**
   * Ensure directory exists (synchronous)
   */
  ensureDirectory() {
    const dir = path.dirname(this.filePath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  }

  /**
   * Get formatted timestamp
   * @returns {string} Formatted date and time
   */
  getTimestamp() {
    const now = new Date();
    return now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  /**
   * Abstract method - to be implemented by subclasses
   */
  async save(data) {
    throw new Error('save() method must be implemented in subclass');
  }

  async read() {
    throw new Error('read() method must be implemented in subclass');
  }
}

/**
 * JSON File Handler - Stores messages in JSON format
 * Demonstrates: Inheritance, Polymorphism
 */
class JSONFileHandler extends BaseFileHandler {
  constructor(filePath) {
    super(filePath);
  }

  /**
   * Save data to JSON file
   * @param {Object} data - Data to save
   */
  async save(data) {
    try {
      let existingData = [];

      // Read existing data if file exists
      try {
        const content = await fsPromises.readFile(this.filePath, 'utf-8');
        existingData = JSON.parse(content);
      } catch (error) {
        // File doesn't exist yet, start with empty array
        existingData = [];
      }

      // Add timestamp to data
      const dataWithTimestamp = {
        ...data,
        timestamp: this.getTimestamp(),
        id: `msg_${Date.now()}`
      };

      // Add to existing data
      existingData.push(dataWithTimestamp);

      // Write back to file
      await fsPromises.writeFile(
        this.filePath,
        JSON.stringify(existingData, null, 2),
        'utf-8'
      );

      return {
        success: true,
        message: 'Data saved to JSON file',
        id: dataWithTimestamp.id
      };
    } catch (error) {
      throw new Error(`Error saving to JSON file: ${error.message}`);
    }
  }

  /**
   * Read data from JSON file
   */
  async read() {
    try {
      const content = await fsPromises.readFile(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Error reading JSON file: ${error.message}`);
    }
  }

  /**
   * Get all entries
   */
  async getAll() {
    return await this.read();
  }

  /**
   * Get entries by date
   * @param {string} date - Date in format MM/DD/YYYY
   */
  async getByDate(date) {
    const allData = await this.read();
    return allData.filter(entry => entry.timestamp.startsWith(date));
  }
}

/**
 * Text File Handler - Stores messages in formatted text format
 * Demonstrates: Inheritance, Polymorphism
 */
class TextFileHandler extends BaseFileHandler {
  constructor(filePath) {
    super(filePath);
  }

  /**
   * Format data as text
   * @param {Object} data - Data to format
   */
  formatAsText(data) {
    const timestamp = this.getTimestamp();
    let text = `\n${'='.repeat(70)}\n`;
    text += `TIMESTAMP: ${timestamp}\n`;
    text += `ID: msg_${Date.now()}\n`;
    text += `${'='.repeat(70)}\n`;

    for (const [key, value] of Object.entries(data)) {
      text += `${key.toUpperCase()}: ${value}\n`;
    }

    return text;
  }

  /**
   * Save data to text file (append mode)
   * @param {Object} data - Data to save
   */
  async save(data) {
    try {
      const formattedText = this.formatAsText(data);
      await fsPromises.appendFile(this.filePath, formattedText, 'utf-8');

      return {
        success: true,
        message: 'Data appended to text file',
        id: `msg_${Date.now()}`
      };
    } catch (error) {
      throw new Error(`Error saving to text file: ${error.message}`);
    }
  }

  /**
   * Read all content from text file
   */
  async read() {
    try {
      const content = await fsPromises.readFile(this.filePath, 'utf-8');
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return '';
      }
      throw new Error(`Error reading text file: ${error.message}`);
    }
  }
}

/**
 * File Storage Service - Main service for managing file storage
 * Demonstrates: Composition, Factory Pattern
 */
class FileStorageService {
  constructor(format = 'json') {
    this.format = format;
    this.storageDir = path.join(__dirname, '../storage/messages');

    // Factory pattern - create appropriate handler based on format
    if (format === 'json') {
      this.handler = new JSONFileHandler(
        path.join(this.storageDir, 'messages.json')
      );
    } else if (format === 'text') {
      this.handler = new TextFileHandler(
        path.join(this.storageDir, 'messages.txt')
      );
    } else {
      throw new Error('Unsupported format. Use "json" or "text"');
    }
  }

  /**
   * Save a message
   * @param {Object} messageData - Message data to save
   */
  async saveMessage(messageData) {
    try {
      const result = await this.handler.save(messageData);
      return result;
    } catch (error) {
      throw new Error(`Failed to save message: ${error.message}`);
    }
  }

  /**
   * Get all messages
   */
  async getAllMessages() {
    try {
      return await this.handler.getAll();
    } catch (error) {
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
  }

  /**
   * Get messages by date (JSON format only)
   * @param {string} date - Date in format MM/DD/YYYY
   */
  async getMessagesByDate(date) {
    if (this.format !== 'json') {
      throw new Error('getMessagesByDate() is only available for JSON format');
    }

    try {
      return await this.handler.getByDate(date);
    } catch (error) {
      throw new Error(`Failed to retrieve messages by date: ${error.message}`);
    }
  }

  /**
   * Get current timestamp
   */
  getCurrentTimestamp() {
    return this.handler.getTimestamp();
  }
}

module.exports = FileStorageService;
