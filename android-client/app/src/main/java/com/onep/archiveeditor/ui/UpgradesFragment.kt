package com.onep.archiveeditor.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.onep.archiveeditor.App
import com.onep.archiveeditor.R
import com.onep.archiveeditor.data.model.GameConfig
import com.onep.archiveeditor.data.model.UserStats
import com.onep.archiveeditor.data.remote.ServiceBuilder
import com.onep.archiveeditor.data.remote.UpgradeStatRequest
import com.onep.archiveeditor.ui.upgrades.UpgradeStatAdapter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class UpgradesFragment : Fragment() {

    private var currentUserStats: UserStats? = null
    private var currentGameConfig: GameConfig? = null

    private lateinit var upgradesRecyclerView: RecyclerView
    private lateinit var upgradeStatAdapter: UpgradeStatAdapter

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
        val view = inflater.inflate(R.layout.fragment_upgrades, container, false)

        upgradesRecyclerView = view.findViewById(R.id.upgrades_recycler_view)
        upgradesRecyclerView.layoutManager = LinearLayoutManager(context)

        currentUserStats?.let { stats ->
            currentGameConfig?.statCosts?.let { statCosts ->
                upgradeStatAdapter = UpgradeStatAdapter(stats, statCosts) { statType, cost ->
                    performUpgrade(statType, cost)
                }
                upgradesRecyclerView.adapter = upgradeStatAdapter
            }
        }

        return view
    }

    private fun performUpgrade(statType: String, cost: Int) {
        // Disable interaction during API call (e.g., show loading spinner)
        // This is a simple prototype, so we'll just disable the adapter for a bit

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val upgradeRequest = UpgradeStatRequest(statType = statType, upgradeAmount = 1)
                val response = ServiceBuilder.apiService.upgradeStat(upgradeRequest)

                withContext(Dispatchers.Main) {
                    if (response.status == "success" && response.updatedStats != null) {
                        App.currentUserStats = response.updatedStats // Update global stats
                        currentUserStats = response.updatedStats // Update fragment's stats
                        upgradeStatAdapter.updateStats(response.updatedStats) // Update adapter
                        (activity as? MainActivity)?.updatePlayerStatsInSidebar() // Notify MainActivity to update sidebar
                    } else {
                        // Show error message
                        (activity as? MainActivity)?.showToastMessage(response.message ?: "Upgrade failed.")
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    (activity as? MainActivity)?.showToastMessage("Error: ${e.message}")
                }
            } finally {
                // Re-enable interaction
            }
        }
    }

    companion object {
        private const val ARG_USER_STATS = "user_stats"
        private const val ARG_GAME_CONFIG = "game_config"

        @JvmStatic
        fun newInstance(userStats: UserStats?, gameConfig: GameConfig?) =
            UpgradesFragment().apply {
                arguments = Bundle().apply {
                    putParcelable(ARG_USER_STATS, userStats)
                    putParcelable(ARG_GAME_CONFIG, gameConfig)
                }
            }
    }
}