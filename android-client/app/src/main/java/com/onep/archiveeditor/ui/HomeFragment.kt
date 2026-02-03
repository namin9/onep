package com.onep.archiveeditor.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.onep.archiveeditor.App
import com.onep.archiveeditor.R
import com.onep.archiveeditor.data.model.GameConfig
import com.onep.archiveeditor.data.model.UserStats
import com.onep.archiveeditor.data.remote.GameProgressRequest
import com.onep.archiveeditor.data.remote.ServiceBuilder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class HomeFragment : Fragment() {

    private var currentUserStats: UserStats? = null
    private var currentGameConfig: GameConfig? = null

    private lateinit var tvStage: TextView
    private lateinit var tvRubies: TextView
    private lateinit var tvInk: TextView
    private lateinit var tvSoulEssence: TextView
    private lateinit var progressBarIdle: ProgressBar
    private lateinit var tvIdleStatus: TextView
    private lateinit var btnCollectIdleRewards: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            currentUserStats = it.getParcelable(ARG_USER_STATS)
            currentGameConfig = it.getParcelable(ARG_GAME_CONFIG)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_home, container, false)

        tvStage = view.findViewById(R.id.text_view_stage)
        tvRubies = view.findViewById(R.id.text_view_rubies)
        tvInk = view.findViewById(R.id.text_view_ink)
        tvSoulEssence = view.findViewById(R.id.text_view_soul_essence)
        progressBarIdle = view.findViewById(R.id.progress_bar_idle)
        tvIdleStatus = view.findViewById(R.id.text_view_idle_status)
        btnCollectIdleRewards = view.findViewById(R.id.button_collect_idle_rewards)

        btnCollectIdleRewards.setOnClickListener {
            collectIdleRewards()
        }

        updateUI()

        return view
    }

    private fun updateUI() {
        currentUserStats?.let { stats ->
            tvStage.text = "Stage: ${stats.highestStage}"
            tvRubies.text = "Rubies: ${stats.rubies}"
            tvInk.text = "Ink: ${stats.ink}"
            tvSoulEssence.text = "Soul Essence: ${stats.soulEssence}"

            // Simulate progress bar for idle rewards (this is client-side only visual)
            // Real idle time calculation is done on the server.
            val progress = (System.currentTimeMillis() % 10000 / 100).toInt() // 0-100 over 10 seconds
            progressBarIdle.progress = progress
            tvIdleStatus.text = "Collecting idle rewards... ${progress}%"
        }
    }

    private fun collectIdleRewards() {
        btnCollectIdleRewards.isEnabled = false
        tvIdleStatus.text = "Collecting rewards..."

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // client_highest_stage is sent from client, backend uses it to verify max stage, not for calculation.
                val data = ServiceBuilder.apiService.progress(GameProgressRequest(clientHighestStage = currentUserStats?.highestStage ?: 1))
                withContext(Dispatchers.Main) {
                    if (data.status == "success" && data.updatedStats != null) {
                        App.currentUserStats = data.updatedStats // Update global stats
                        currentUserStats = data.updatedStats // Update fragment's stats
                        updateUI()
                        tvIdleStatus.text = "Collected ${data.rewards?.rubiesEarned} Rubies!"
                    } else {
                        tvIdleStatus.text = data.message ?: "Failed to collect rewards."
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvIdleStatus.text = "Error: ${e.message}"
                }
            } finally {
                withContext(Dispatchers.Main) {
                    btnCollectIdleRewards.isEnabled = true
                }
            }
        }
    }

    companion object {
        private const val ARG_USER_STATS = "user_stats"
        private const val ARG_GAME_CONFIG = "game_config"

        @JvmStatic
        fun newInstance(userStats: UserStats?, gameConfig: GameConfig?) =
            HomeFragment().apply {
                arguments = Bundle().apply {
                    putParcelable(ARG_USER_STATS, userStats)
                    putParcelable(ARG_GAME_CONFIG, gameConfig)
                }
            }
    }
}