import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MessageService } from './message.service';

import { CloudStatus } from './cloud-status';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CloudRetrievalService {
  
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient, private messageService: MessageService) { }

  getAKSCloudStatus(): Observable<CloudStatus[]> {
    return this.http.get<CloudStatus[]>(this.azureAksUrl)
      .pipe(
        tap(_ => this.log('Fetched Cloud Services Result')),
        catchError(this.handleError<CloudStatus[]>('getAKSCloudStatus', []))
      );
  }

  getAKSDefendedStatus(): Observable<CloudStatus[]> {
    return this.http.get<CloudStatus[]>(this.azureAKSDefended)
      .pipe(
        tap(_ => this.log('Fetched Cloud Services Result')),
        catchError(this.handleError<CloudStatus[]>('getAKSCloudStatus', []))
      );
  }


   /** Log a HeroService message with the MessageService */
   private log(message: string) {
    this.messageService.add(`Cloud Service: ${message}`);
  }
  private testUrl = 'https://dummy.restapiexample.com/api/v1/employees'
  private azureAksUrl = 'http://localhost:8080/clouddiscovery/bytype?type=azure-aks&deployed=false';  // URL to web api
  private azureAKSDefended = 'http://localhost:8080/clouddiscovery/bytype?type=azure-aks&deployed=true';
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
  
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead
  
      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);
  
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}