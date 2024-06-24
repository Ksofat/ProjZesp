import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class App {
    public static void main(String[] args) {
        // Login credentials
        String email = "bob.brown@example.com";
        String password = "hashed_password";

        // Create HTTP client
        HttpClient client = HttpClient.newHttpClient();

        // Create login request
        Map<Object, Object> data = new HashMap<>();
        data.put("email", email);
        data.put("password", password);

        // Build request body as JSON
        String requestBody = "{ \"email\": \"" + email + "\", \"password\": \"" + password + "\" }";

        // Create POST request for login
        HttpRequest loginRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:1337/login")) // Replace with appropriate server address
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        try {
            // Send login request
            HttpResponse<String> loginResponse = client.send(loginRequest, HttpResponse.BodyHandlers.ofString());

            // Check response status
            if (loginResponse.statusCode() == 200) {
                // If login is successful, display message
                System.out.println("Logged in successfully.");

                // Get cookies from response
                Map<String, List<String>> headers = loginResponse.headers().map();
                List<String> cookies = headers.getOrDefault("Set-Cookie", new ArrayList<>());

                // Make subsequent request, for example, fetch products
                HttpRequest productsRequest = HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:1337/products")) // Replace with appropriate server address
                        .header("Cookie", String.join("; ", cookies)) // Pass cookies in header
                        .GET()
                        .build();

                // Send products request
                HttpResponse<String> productsResponse = client.send(productsRequest, HttpResponse.BodyHandlers.ofString());

                // Display response
                System.out.println("Product list:");
                String responseBody = productsResponse.body();
                responseBody = responseBody.replaceAll("\"image\":\\{.*?\\},?", ""); // Remove "image" field
                System.out.println(responseBody);
            } else {
                // In case of login error, display message
                System.out.println("Login error: " + loginResponse.body());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

