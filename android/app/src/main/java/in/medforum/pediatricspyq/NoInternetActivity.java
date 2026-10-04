package in.medforum.pediatricspyq;

import android.os.Bundle;
import android.view.View; // Correct import
import android.widget.Button;
import androidx.appcompat.app.AppCompatActivity;

public class NoInternetActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_no_internet);

        Button btnGoToMain = findViewById(R.id.btn_go_to_main);

        // Set up the "Go to App" button
        btnGoToMain.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Finish this activity to remove the warning screen.
                // This reveals the MainActivity which is paused underneath.
                finish();
            }
        });
    }
}