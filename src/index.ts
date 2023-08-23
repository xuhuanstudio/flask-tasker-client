import axios, { AxiosHeaders, Method, RawAxiosRequestHeaders } from 'axios';
import {io} from "socket.io-client";

type Config = {
  baseUrl: string,
  dispose: string,
  terminate: string,
  namescape: string,
  activateEvent: string,
  progressEvent: string,
  successEvent: string,
  errorEvent: string,
  terminateEvent: string
}

type MethodsHeaders = Partial<{
  [Key in Method as Lowercase<Key>]: AxiosHeaders;
} & {common: AxiosHeaders}>;

type Task = {
  task_id?: string,
  data?: object,
  headers?: (RawAxiosRequestHeaders & MethodsHeaders) | AxiosHeaders,
  onProgress?: (res: {task_id: string, data?: any}) => void,
  onSuccess?: (res: {task_id: string, data?: any}) => void,
  onError?: (res: {task_id: string, data?: any}) => void,
  onTerminate?: (res: {task_id: string, data?: any}) => void,
}

class Tasker {
  
  config: Config;
  
  /**
   * @param baseUrl Base url of tasker server.
   * @param dispose Path to dispose new task.
   * @param terminate Path to terminate task.
   * @param namescape Namescape of socket.io.
   * @param activateEvent Event name of socket.io to activate task.
   * @param progressEvent Event name of socket.io to listen task progress.
   * @param successEvent Event name of socket.io to listen task success.
   * @param errorEvent Event name of socket.io to listen task error.
   * @param terminateEvent Event name of socket.io to terminate task.
   * @constructor
   */ 
  constructor({baseUrl, dispose, terminate, namescape, activateEvent, progressEvent, successEvent, errorEvent, terminateEvent}: Partial<Config> & {baseUrl: string}) {
    
    this.config = {
      baseUrl: baseUrl,
      dispose: dispose ? dispose : '/dispose',
      terminate: terminate ? terminate : '/terminate',
      namescape: namescape ? namescape : '/status',
      activateEvent: activateEvent ? activateEvent : 'activate',
      progressEvent: progressEvent ? progressEvent : 'progress',
      successEvent: successEvent ? successEvent : 'success',
      errorEvent: errorEvent ? errorEvent : 'error',
      terminateEvent: terminateEvent ? terminateEvent : 'terminate'
    }
  }

  /**
   * Dispose new task or join to existing task.
   * @param task_id Task id, if not set, new task will be created.
   * @param data Data to be passed to the task.
   * @param headers Request headers to be passed to the task.
   * @param onProgress Function to be called when task is progress.
   * @param onSuccess Function to be called when task is success.
   * @param onError Function to be called when task is error.
   * @param onTerminate Function to be called when task is terminated.
   * @returns Terminate function and promise of task. 
   * Terminate function will be called to terminate the task, 
   * promise will be resolved when task is success and rejected when task is error.
   * @private
   */
  private _task({task_id, data, headers, onProgress, onSuccess, onError, onTerminate}: Task) {
    const returnObject: {
      terminate: () => Promise<any>,
      promise: Promise<any>
    } = {terminate: () => Promise.reject('Task not activated'), promise: Promise.resolve()};
    
    if (task_id) {
      returnObject.terminate = () => axios.post(this.config.baseUrl + this.config.terminate, {task_id});
    }

    returnObject.promise = new Promise((resolve, reject) => {
      const query = task_id ? {task_id} : {};

      const socket = io(this.config.baseUrl + this.config.namescape, {query})
        .on(this.config.activateEvent, res => {
          returnObject.terminate = () => axios.post(this.config.baseUrl + this.config.terminate, {task_id: res.task_id});

          axios.post(this.config.baseUrl + this.config.dispose, {task_id: res.task_id, ...data}, headers ? {headers} : {})
            .catch(err => {
              onError instanceof Function && onError(err);
              reject(err);
            });     
        });

      onProgress instanceof Function && socket.on(this.config.progressEvent, onProgress);
      onTerminate instanceof Function && socket.on(this.config.terminateEvent, onTerminate);

      socket.on(this.config.successEvent, res => {
        onSuccess instanceof Function && onSuccess(res);
        resolve(res);
      }).on(this.config.errorEvent, err => {
        onError instanceof Function && onError(err);
        reject(err);
      });
    });
    
    return returnObject;
  }

  /**
   * Dispose new task.
   * @param data Data to be passed to the task.
   * @param headers Request headers to be passed to the task.
   * @param onProgress Function to be called when task is progress.
   * @param onSuccess Function to be called when task is success.
   * @param onError Function to be called when task is error.
   * @param onTerminate Function to be called when task is terminated.
   * @returns Terminate function and promise of task.
   * Terminate function will be called to terminate the task,
   * promise will be resolved when task is success and rejected when task is error.
   */
  dispose({data, headers, onProgress, onSuccess, onError, onTerminate}: Omit<Task, 'task_id'>) {
    return this._task({data, headers, onProgress, onSuccess, onError, onTerminate});
  }

  /**
   * Join to existing task.
   * @param task_id Task id.
   * @param headers Request headers to be passed to the task.
   * @param onProgress Function to be called when task is progress.
   * @param onSuccess Function to be called when task is success.
   * @param onError Function to be called when task is error.
   * @param onTerminate Function to be called when task is terminated.
   * @returns Terminate function and promise of task.
   * Terminate function will be called to terminate the task,
   * promise will be resolved when task is success and rejected when task is error.
   */
  join({task_id, headers, onProgress, onSuccess, onError, onTerminate}: Omit<Task, 'data'>) {
    return this._task({task_id, headers, onProgress, onSuccess, onError, onTerminate});
  }

}

export {Tasker};
