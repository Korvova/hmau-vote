/**
 * API клиент для автотестов
 *
 * Использование:
 *   const { apiClient } = require('./helpers/api-client');
 *   const response = await apiClient.get('/api/meetings');
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@admin.ru';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '123';

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
    this.token = null;
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Добавляем interceptor для автоматического добавления токена
    this.axios.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  /**
   * Авторизация в системе
   */
  async login(email = TEST_USER_EMAIL, password = TEST_USER_PASSWORD) {
    try {
      const response = await this.axios.post('/api/login', {
        username: email,
        password
      });

      if (response.data.token) {
        this.token = response.data.token;
        console.log(`[API Client] Logged in as ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[API Client] Login failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * GET запрос
   */
  async get(url, params = {}) {
    try {
      const response = await this.axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`[API Client] GET ${url} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * POST запрос
   */
  async post(url, data = {}) {
    try {
      const response = await this.axios.post(url, data);
      return response.data;
    } catch (error) {
      console.error(`[API Client] POST ${url} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * PUT запрос
   */
  async put(url, data = {}) {
    try {
      const response = await this.axios.put(url, data);
      return response.data;
    } catch (error) {
      console.error(`[API Client] PUT ${url} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * DELETE запрос
   */
  async delete(url) {
    try {
      const response = await this.axios.delete(url);
      return response.data;
    } catch (error) {
      console.error(`[API Client] DELETE ${url} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Получить список всех заседаний
   */
  async getMeetings() {
    return this.get('/api/meetings');
  }

  /**
   * Получить заседание по ID
   */
  async getMeeting(id) {
    return this.get(`/api/meetings/${id}`);
  }

  /**
   * Создать заседание
   */
  async createMeeting(data) {
    return this.post('/api/meetings', data);
  }

  /**
   * Получить участников заседания
   */
  async getMeetingParticipants(meetingId) {
    return this.get(`/api/meetings/${meetingId}/participants`);
  }

  /**
   * Сохранить настройки участников
   */
  async saveMeetingParticipants(meetingId, participants) {
    return this.post(`/api/meetings/${meetingId}/participants/save`, { participants });
  }

  /**
   * Запустить голосование
   */
  async startVote(agendaItemId, data) {
    return this.post('/api/start-vote', {
      agendaItemId,
      ...data
    });
  }

  /**
   * Получить результаты голосований
   */
  async getVoteResults(meetingId) {
    return this.get('/api/vote-results', { meetingId });
  }

  /**
   * Получить список подразделений
   */
  async getDivisions() {
    return this.get('/api/divisions');
  }

  /**
   * Получить список пользователей
   */
  async getUsers() {
    return this.get('/api/users');
  }
}

// Создаем singleton инстанс
const apiClient = new ApiClient();

module.exports = {
  apiClient,
  ApiClient
};
