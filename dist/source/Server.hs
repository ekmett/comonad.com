{-# LANGUAGE OverloadedStrings #-}
-- New HTTP companion for the migration pilot; not an original 2013 snippet.
-- cabal run crc-server, then open http://127.0.0.1:8081/
module Main (main) where

import CRC
import qualified Data.ByteString.Char8 as BS
import qualified Data.ByteString.Lazy.Char8 as LBS
import Network.HTTP.Types (status200, status400, status404)
import Network.Wai
import Network.Wai.Handler.Warp (runSettings, defaultSettings, setHost, setPort)
import Text.Read (readMaybe)

main :: IO ()
main = do
  putStrLn "CRC server: http://127.0.0.1:8081/"
  runSettings (setHost "127.0.0.1" (setPort 8081 defaultSettings)) app

app :: Application
app request respond
  | requestMethod request /= "GET" = respond $ responseLBS status400 headers "GET required"
  | rawPathInfo request == "/" = respond $ responseLBS status200
      [("Content-Type", "text/html; charset=utf-8")]
      "<!doctype html><title>Haskell CRC server</title><h1>Parallel CRCs</h1><form action='/crc'><label>Message <input name='message' value='123456789'></label> <label>Split after bytes <input name='split' type='number' value='4' min='0'></label> <button>Calculate</button></form>"
  | rawPathInfo request /= "/crc" = respond $ responseLBS status404 headers "Not found"
  | BS.length message > 4096 = respond $ responseLBS status400 headers "Message too large"
  | otherwise = case readMaybe (BS.unpack splitText) of
      Just split | split >= 0 && split <= BS.length message -> do
        let bytes = BS.unpack message
            input = map (fromIntegral . fromEnum) bytes
            (a, b) = splitAt split input
            answer = finish (summarize a <> summarize b)
            body = "{\"direct\":" ++ show (direct input)
              ++ ",\"combined\":" ++ show answer
              ++ ",\"bytes\":" ++ show (length input) ++ "}"
        respond $ responseLBS status200 [("Content-Type", "application/json")] (LBS.pack body)
      _ -> respond $ responseLBS status400 headers "Invalid byte split"
  where
    query = queryString request
    message = maybe "123456789" id (lookup "message" query >>= id)
    splitText = maybe "0" id (lookup "split" query >>= id)
    headers = [("Content-Type", "text/plain; charset=utf-8")]
