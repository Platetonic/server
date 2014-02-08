// TODO: link user object (picture, restaurant catagory picked, lat, long, unique id)


public JSONArray getRestaurantArray() {
    int radius = 3;

    HttpClient httpClient = new DefaultHttpClient();
    String url = "http://api.tripadvisor.com/api/partner/1.0/location/60745/restaurants?key=92C34F58BB4F4E03894F5D171B79857E&cuisines=" + restaurantCategory;
    HttpGet httpGet = new HttpGet(url);

    HttpResponse httpResponse = httpClient.execute(httpGet);
    HttpEntity httpEntity = httpResponse.getEntity();
    String output = EntityUtils.toString(httpEntity);

    JSONObject dataObject = new JSONObject(output);
    JSONArray restaurants = dataObject.getJSONArray(data);
    JSONArray distSortedRestaurants = new JSONArray();
    for(JSONObject restaurant : restaurants) {
        if(distanceBetween(restaurant.latitude, restaurant.longitude, user.latitude, user.longitude) < radius) {
            distSortedRestaurants.add(restaurant);
        }
    }

    if(distSortedRestaurants.size() > 5) {
        for(i=distSortedRestaurants.size(); i==5; i--) {
            Random rand = new Random();
            int x = rand.nextInt(distSortedRestaurants.size());
            distSortedRestaurants.remove(x);
        }
    }

    return distSortedRestaurants;
}

public double toRad(double degrees) {
    return degrees * Math.PI / 180;
}

public double distanceBetween(double lat1, double long1, double lat2, double long2) {
    double EARTH_RADIUS = 3963.1906;
    double dLat = toRad(lat1 - lat2);
    double dLon = toRad(long1 - long2);
    double l1 = toRad(lat1);
    double l2 = toRad(lat2);

    double a = (Math.sin(dLat/2) * Math.sin(dLat/2)) + (Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(l1) * Math.cos(l2)); 
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 

    return EARTH_RADIUS * c;
}

public void postDataBeforeRestaurant() {
    // Create a new HttpClient and Post Header
    HttpClient httpclient = new DefaultHttpClient();
    HttpPost httppost = new HttpPost("172.16.7.237:8080");

    try {
        // Add data
        List<NameValuePair> nameValuePairs = new ArrayList<NameValuePair>(7);
        nameValuePairs.add(new BasicNameValuePair("restaurantId", "45678")); /// Restaurant ID
        nameValuePairs.add(new BasicNameValuePair("duration", "35 + 56")); // systime + time frame
        nameValuePairs.add(new BasicNameValuePair("5084983232")); // systime + time frame
        nameValuePairs.add(new BasicNameValuePair("id", "12345")); /// FB
        nameValuePairs.add(new BasicNameValuePair("longitude", "34")); // long
        nameValuePairs.add(new BasicNameValuePair("latitude", "34")); // lat
        nameValuePairs.add(new BasicNameValuePair("avatarUrl", "graph.facebook.com/username/picture")); //picture
        nameValuePairs.add(new BasicNameValuePair("foodPreference", "Italian")); //picture
        httppost.setEntity(new UrlEncodedFormEntity(nameValuePairs));

        // Execute HTTP Post Request (Response = List of people)
        HttpResponse response = httpclient.execute(httppost);
        String responseString = inputStreamToString(response);
        
    } catch (ClientProtocolException e) {
        // TODO Auto-generated catch block
    } catch (IOException e) {
        // TODO Auto-generated catch block
    }
} 

private StringBuilder inputStreamToString(InputStream is) {
    String line = "";
    StringBuilder total = new StringBuilder();
    
    // Wrap a BufferedReader around the InputStream
    BufferedReader rd = new BufferedReader(new InputStreamReader(is));

    // Read response until the end
    while ((line = rd.readLine()) != null) { 
        total.append(line); 
    }
    
    // Return full string
    return total;
}