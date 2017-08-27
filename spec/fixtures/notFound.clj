(ns guestbook.routes.home
  (:require [guestbook.layout :as layout]
            [compojure.core :refer [defroutes GET]]))  ;; missing POST

(defroutes home-routes
  (POST "/message" request (save-message! request))
