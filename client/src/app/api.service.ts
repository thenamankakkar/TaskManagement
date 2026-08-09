import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

export type Role = 'manager' | 'team_lead' | 'employee';
export interface User { _id: string; username: string; email: string; role: Role; }
export interface Task { _id: string; title: string; description: string; status: 'pending' | 'completed'; assignedTo: User; createdBy: User; updatedAt: string; }
@Injectable({ providedIn: 'root' }) export class ApiService {
  private readonly base = 'http://localhost:3000/api'; private socket?: Socket;
  constructor(private http: HttpClient) {}
  login(data: { email: string; password: string }) { return this.http.post<{ user: User; token: string }>(`${this.base}/auth/login`, data); }
  register(data: unknown) { return this.http.post<{ user: User; token: string }>(`${this.base}/auth/register`, data); }
  tasks(status = '') { return this.http.get<Task[]>(`${this.base}/tasks${status ? `?status=${status}` : ''}`); }
  users() { return this.http.get<User[]>(`${this.base}/users`); }
  createTask(data: unknown) { return this.http.post<Task>(`${this.base}/tasks`, data); }
  updateTask(id: string, data: unknown) { return this.http.patch<Task>(`${this.base}/tasks/${id}`, data); }
  deleteTask(id: string) { return this.http.delete(`${this.base}/tasks/${id}`); }
  connect(onChange: () => void) { this.socket?.disconnect(); this.socket = io('http://localhost:3000'); this.socket.on('task:changed', onChange); }
  disconnect() { this.socket?.disconnect(); }
}
