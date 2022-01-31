package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"golang.org/x/crypto/acme/autocert"

	// "github.com/golang-jwt/jwt"
	"github.com/opti21/pepega-ws/pkg/db"
	"github.com/opti21/pepega-ws/pkg/redis"
	"github.com/opti21/pepega-ws/pkg/utils"
	"github.com/opti21/pepega-ws/pkg/websocket"
)

type UpdateMessage struct {
  Type string `json:"type"`
  IsUpdating bool `json:"is_updating"`
  BeingUpdatedBy string `json:"being_updated_by"`
  Order string `json:"order"`
}

type QueueUpdate struct {
  Type string `json:"type"`
  IsUpdating bool `json:"is_updating"`
  BeingUpdatedBy string `json:"being_updated_by"`
  Order string `json:"order"`
}

const (
  htmlIndex = `<html><body>Pepega ws!</body></html>`
  httpPort = "127.0.0.1:80"
)

var (
  ctxB = context.Background()
  addr = flag.String("addr", "localhost:8080", "http service address")
  flgProduction = false
  flgRedirectHTTPToHTTPS = false
)

func handleIndex(w http.ResponseWriter, r *http.Request) {
  io.WriteString(w, htmlIndex)
}

func makeServerFromMux(mux *http.ServeMux) *http.Server {
  // set timeouts so that a slow or malicious client
  // doesn't hold resources forever
  return &http.Server {
    ReadTimeout: 5 * time.Second,
    WriteTimeout: 5 * time.Second,
    IdleTimeout: 120 * time.Second,
    Handler: mux,
  }
}

func makeHTTPServer() * http.Server {
  pool := websocket.NewPool()
  go pool.Start()

  mux := &http.ServeMux{}
  mux.HandleFunc("/", handleIndex)
  mux.HandleFunc("/modws", func(w http.ResponseWriter, r *http.Request) {
    serveWs(pool, w, r)
  })
  return makeServerFromMux(mux)
}

func makeHTTPToHTTPSRedirectServer() *http.Server {
  pool := websocket.NewPool()
  go pool.Start()

  handleRedirect := func(w http.ResponseWriter, r * http.Request) {
    newURI := "https://" + r.Host + r.URL.String()
    http.Redirect(w, r, newURI, http.StatusFound)
  }
  mux := &http.ServeMux{}
  mux.HandleFunc("/", handleRedirect)
  mux.HandleFunc("/modws", func(w http.ResponseWriter, r *http.Request) {
    serveWs(pool, w, r)
  })
  return makeServerFromMux(mux)
}

func parseFlags() {
  flag.BoolVar(&flgProduction, "production", false, "if true, we start HTTPS server")
	flag.BoolVar(&flgRedirectHTTPToHTTPS, "redirect-to-https", false, "if true, we redirect HTTP to HTTPS")
	flag.Parse()
}


func serveWs(pool *websocket.Pool, w http.ResponseWriter, r *http.Request) {
  fmt.Println("WebSocket Endpoint Hit")

  conn, err := websocket.Upgrade(w, r)
  if err != nil {
    fmt.Fprintf(w, "%+V\n", err)
  }

  client := &websocket.Client{
    Conn: conn,
    Pool: pool,
  }

  //server key
  fmt.Println(r.Header)
  if r.Header["Pepega-Ws-Key"] != nil {
    for _, key := range r.Header["Pepega-Ws-Key"] {
      fmt.Println(key)
      if key == utils.GetEnv("SERVER_WS_KEY") {
        fmt.Println("THIS WORK?")
        pool.Register <- client
        client.Read()
      }
    }
  }

  var acceptedOrigin = "http://localhost:3000"

   for _, origin := range r.Header["Origin"] {
     fmt.Println(origin)
     if origin == acceptedOrigin {
  fmt.Println("GO HERE?")
  fmt.Println(r.Header)
       for _, cookie := range r.Cookies() {
         // Next auth session from frontend
         if cookie.Name == "next-auth.session-token" {
           if db.CheckIfMod(cookie.Value) {
            pool.Register <- client
            client.Read()
           }
         }
       }
       // if no required headers are sent close connection
     }
   }

}


func main() {
  log.Println("pepega-ws v0.01")

  parseFlags()
  utils.Init()
  db.Init()
  redis.Init()

  var m * autocert.Manager

  var httpsSrv *http.Server

  if flgProduction {
    httpsSrv = makeHTTPServer()
    httpsSrv.Addr = ":443"

    go func() {
      fmt.Printf("Starting HTTPS server on %s\n", httpsSrv.Addr)
      err := httpsSrv.ListenAndServeTLs("copilotlicense.com.pem", "copilotlicense.com.key")
      if err != nil {
        log.Fatalf("httpsSrv.ListenAndServeTLS() failed with %s", err)
      }
    }()

  }

  var httpSrv *http.Server
  if flgRedirectHTTPToHTTPS {
    httpSrv = makeHTTPToHTTPSRedirectServer()
  } else {
    httpSrv = makeHTTPServer()
  }

  if m != nil {
    httpSrv.Handler = m.HTTPHandler(httpSrv.Handler)
  }

  httpSrv.Addr = httpPort
  fmt.Printf("Starting HTTP server on %s\n", httpPort)
  err := httpSrv.ListenAndServe()
  if err != nil {
    log.Fatalf("httpSrv.ListenAndServe() failed with %s", err)
  }


}
