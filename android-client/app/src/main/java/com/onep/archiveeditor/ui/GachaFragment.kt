package com.onep.archiveeditor.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.onep.archiveeditor.App
import com.onep.archiveeditor.R
import com.onep.archiveeditor.data.model.GameConfig
import com.onep.archiveeditor.data.model.UserStats
import com.onep.archiveeditor.data.remote.GachaPullRequest
import com.onep.archiveeditor.data.remote.ServiceBuilder
import com.onep.archiveeditor.ui.gacha.GachaSkinAdapter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class GachaFragment : Fragment() {

    private var currentUserStats: UserStats? = null
    private var currentGameConfig: GameConfig? = null

    private lateinit var inkDisplay: TextView
    private lateinit var buttonGacha1x: Button
    private lateinit var buttonGacha10x: Button
    private lateinit var gachaResultsRecyclerView: RecyclerView
    private lateinit var gachaSkinAdapter: GachaSkinAdapter

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
        val view = inflater.inflate(R.layout.fragment_gacha, container, false)

        inkDisplay = view.findViewById(R.id.gacha_ink_display)
        buttonGacha1x = view.findViewById(R.id.button_gacha_1x)
        buttonGacha10x = view.findViewById(R.id.button_gacha_10x)
        gachaResultsRecyclerView = view.findViewById(R.id.gacha_results_recycler_view)

        gachaResultsRecyclerView.layoutManager = GridLayoutManager(context, 2) // 2 columns
        gachaSkinAdapter = GachaSkinAdapter(mutableListOf()) // Initialize with empty list
        gachaResultsRecyclerView.adapter = gachaSkinAdapter

        buttonGacha1x.setOnClickListener { performGachaPull(1) }
        buttonGacha10x.setOnClickListener { performGachaPull(10) }

        updateUI()

        return view
    }

    private fun updateUI() {
        currentUserStats?.let { stats ->
            inkDisplay.text = "Your Ink: ${stats.ink}"
        }
    }

    private fun performGachaPull(pullCount: Int) {
        buttonGacha1x.isEnabled = false
        buttonGacha10x.isEnabled = false

        val costPerPull = 100 // Hardcoded for now, ideally from gameConfig
        val totalCost = costPerPull * pullCount

        if ((currentUserStats?.ink ?: 0) < totalCost) {
            (activity as? MainActivity)?.showToastMessage("Not enough Ink!", "error")
            buttonGacha1x.isEnabled = true
            buttonGacha10x.isEnabled = true
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val data = ServiceBuilder.apiService.gachaPull(GachaPullRequest(pullCount = pullCount))
                withContext(Dispatchers.Main) {
                    if (data.status == "success" && data.updatedStats != null && data.obtainedSkins != null) {
                        App.currentUserStats = data.updatedStats // Update global stats
                        currentUserStats = data.updatedStats // Update fragment's stats
                        gachaSkinAdapter.updateSkins(data.obtainedSkins) // Update results
                        updateUI() // Update Ink display
                        (activity as? MainActivity)?.updatePlayerStatsInSidebar() // Update sidebar
                        (activity as? MainActivity)?.showToastMessage("Pulled ${pullCount} item(s)!")
                    } else {
                        (activity as? MainActivity)?.showToastMessage(data.message ?: "Gacha pull failed.", "error")
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    (activity as? MainActivity)?.showToastMessage("Error: ${e.message}", "error")
                }
            } finally {
                withContext(Dispatchers.Main) {
                    buttonGacha1x.isEnabled = true
                    buttonGacha10x.isEnabled = true
                }
            }
        }
    }

    companion object {
        private const val ARG_USER_STATS = "user_stats"
        private const val ARG_GAME_CONFIG = "game_config"

        @JvmStatic
        fun newInstance(userStats: UserStats?, gameConfig: GameConfig?) =
            GachaFragment().apply {
                arguments = Bundle().apply {
                    putParcelable(ARG_USER_STATS, userStats)
                    putParcelable(ARG_GAME_CONFIG, gameConfig)
                }
            }
    }
}