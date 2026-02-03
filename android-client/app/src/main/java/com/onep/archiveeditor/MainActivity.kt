package com.onep.archiveeditor

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast // Import Toast
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.fragment.app.Fragment
import com.google.android.material.bottomnavigation.BottomNavigationView

import com.onep.archiveeditor.data.model.GameConfig
import com.onep.archiveeditor.data.model.UserStats
import com.onep.archiveeditor.data.remote.LoginRequest
import com.onep.archiveeditor.data.remote.ServiceBuilder
import com.onep.archiveeditor.ui.GachaFragment
import com.onep.archiveeditor.ui.HomeFragment
import com.onep.archiveeditor.ui.LibraryFragment
import com.onep.archiveeditor.ui.SoulFragment
import com.onep.archiveeditor.ui.UpgradesFragment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var loginScreenLayout: ConstraintLayout
    private lateinit var loginButton: Button
    private lateinit var loginStatusTextView: TextView
    private lateinit var mainGameScreenLayout: ConstraintLayout
    private lateinit var bottomNavigationView: BottomNavigationView

    // Sidebar player stats TextViews
    private lateinit var playerRubiesTextView: TextView
    private lateinit var playerInkTextView: TextView
    private lateinit var playerSoulEssenceTextView: TextView

    // Placeholder for game loop management
    private var gameLoopJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        loginScreenLayout = findViewById(R.id.login_screen_layout)
        loginButton = findViewById(R.id.login_button)
        loginStatusTextView = findViewById(R.id.login_status_text_view)
        mainGameScreenLayout = findViewById(R.id.main_game_screen_layout)
        bottomNavigationView = findViewById(R.id.bottom_navigation)

        // Initialize sidebar TextViews
        playerRubiesTextView = findViewById(R.id.player_rubies)
        playerInkTextView = findViewById(R.id.player_ink)
        playerSoulEssenceTextView = findViewById(R.id.player_soul_essence)

        loginButton.setOnClickListener {
            performLogin()
        }

        bottomNavigationView.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_home -> replaceFragment(HomeFragment.newInstance(App.currentUserStats, App.gameConfig))
                R.id.navigation_upgrades -> replaceFragment(UpgradesFragment.newInstance(App.currentUserStats, App.gameConfig))
                R.id.navigation_gacha -> replaceFragment(GachaFragment()) // Will update these fragments later
                R.id.navigation_library -> replaceFragment(LibraryFragment()) // Will update these fragments later
                R.id.navigation_soul -> replaceFragment(SoulFragment()) // Will update these fragments later
                else -> false
            }
            true
        }
    }

    override fun onStart() {
        super.onStart()
        // Start game loop when activity becomes visible (if logged in and on main screen)
        if (App.jwtToken != null && mainGameScreenLayout.visibility == View.VISIBLE) {
            startGameLoop()
            updatePlayerStatsInSidebar() // Refresh sidebar stats
        }
    }

    override fun onStop() {
        super.onStop()
        // Stop game loop when activity is no longer visible
        stopGameLoop()
    }

    private fun performLogin() {
        loginStatusTextView.text = "Attempting to log in..."
        loginButton.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val loginRequest = LoginRequest(serverAuthCode = "valid_google_code", clientVersion = "1.0.0")
                val response = ServiceBuilder.apiService.login(loginRequest)

                withContext(Dispatchers.Main) {
                    if (response.status == "success") {
                        App.jwtToken = response.jwt
                        App.currentUserStats = response.userData.stats
                        App.gameConfig = response.gameConfig

                        loginStatusTextView.text = "Login successful! Welcome, ${response.userData.stats.userId}"
                        loginScreenLayout.visibility = View.GONE
                        mainGameScreenLayout.visibility = View.VISIBLE
                        // Load the default fragment (Home) after successful login
                        replaceFragment(HomeFragment.newInstance(App.currentUserStats, App.gameConfig))
                        startGameLoop() // Start game loop after login
                        updatePlayerStatsInSidebar() // Initial sidebar update
                    } else {
                        loginStatusTextView.text = "Login failed: ${response.message ?: "Unknown error"}"
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    loginStatusTextView.text = "Login failed: ${e.message}"
                }
            } finally {
                withContext(Dispatchers.Main) {
                    loginButton.isEnabled = true
                }
            }
        }
    }

    fun updatePlayerStatsInSidebar() {
        App.currentUserStats?.let { stats ->
            playerRubiesTextView.text = "Rubies: ${stats.rubies}"
            playerInkTextView.text = "Ink: ${stats.ink}"
            playerSoulEssenceTextView.text = "Essence: ${stats.soulEssence}"
        }
    }

    fun showToastMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun replaceFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.main_content_frame, fragment)
            .commit()
    }

    private fun startGameLoop() {
        // Implement game loop (e.g., call progress API periodically)
        // For now, this is a placeholder. Actual implementation will involve a ViewModel and LiveData.
        if (gameLoopJob == null || gameLoopJob?.isActive == false) {
            gameLoopJob = CoroutineScope(Dispatchers.Main).launch {
                while (true) {
                    // This is a simplified client-side loop for UI updates.
                    // Actual API calls to /api/game/progress will be handled in HomeFragment or a Service.
                    // For now, let's just log or update a local state.
                    // delay(1000) // Update UI every second
                }
            }
        }
    }

    private fun stopGameLoop() {
        gameLoopJob?.cancel()
        gameLoopJob = null
    }
}