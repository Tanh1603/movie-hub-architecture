# Sequence Diagram - Real-time Seat Update Flow

```mermaid
sequenceDiagram
    participant Member as Member (Web App)
    participant API_WS as API Gateway (WebSocket)
    participant Cinema as Cinema Service (NestJS)
    participant Redis as Redis (Pub/Sub)

    Member->>API_WS: WebSocket emit "gateway.hold_seat" (showtimeId, seatId)
    API_WS->>Redis: PUBLISH gateway.hold_seat (showtimeId, seatId, userId)
    Redis->>Cinema: SUBSCRIBE event
    Cinema->>Redis: Check hold:showtime:{showtimeId}:{seatId} exists?
    alt Seat Available
        Cinema->>Redis: Check user hold count < 8
        alt Under Limit
            Cinema->>Redis: SET hold:showtime:{id}:{seatId} (userId) EX 600
            Cinema->>Redis: SADD hold:user:{userId}:showtime:{id} (seatId) EX 600
            Cinema->>Redis: PUBLISH cinema.seat_held (showtimeId, seatId, userId)
            Redis->>API_WS: Broadcast to showtimeId room
            API_WS->>Member: WebSocket emit "seat_held" (update UI)
        else Limit Reached
            Cinema->>Redis: PUBLISH cinema.seat_limit_reached
            API_WS->>Member: WebSocket emit "seat_limit_reached"
        end
    else Seat Taken
        Cinema->>Redis: PUBLISH cinema.seat_already_held
        API_WS->>Member: WebSocket emit "seat_already_held"
    end
```

This sequence diagram shows the real-time seat hold propagation using Redis Pub/Sub, highlighting performance, scalability, and concurrency control for high-concurrency seat interactions.
