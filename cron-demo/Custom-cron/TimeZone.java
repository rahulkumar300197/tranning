import java.util.TimeZone;
import java.util.concurrent.TimeUnit;
import java.nio.file.*;
import java.util.ArrayList;
import java.nio.charset.Charset;
class TimeZoneExample {

	public static void main(String[] args) {
                ArrayList<String> lines = new ArrayList<>();
		String[] ids = TimeZone.getAvailableIDs();
		for (String id : ids) {
			lines.add(displayTimeZone(TimeZone.getTimeZone(id)));
		}
              
                Path file = Paths.get("the-file-name.txt");
                try{
                 Files.write(file, lines, Charset.forName("UTF-8"));
                }catch(Exception e){}

		System.out.println("\nTotal TimeZone ID " + ids.length);

	}

	static String displayTimeZone(TimeZone tz) {

                float x=tz.getRawOffset();

		String result = "";
		result = String.format("\"%s\" : %f ,", tz.getID(), -x/3600000);
	
		return result;

	}

}
