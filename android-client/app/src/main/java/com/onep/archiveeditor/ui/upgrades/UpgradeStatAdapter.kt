package com.onep.archiveeditor.ui.upgrades

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.onep.archiveeditor.R
import com.onep.archiveeditor.data.model.StatCostConfig
import com.onep.archiveeditor.data.model.UserStats

class UpgradeStatAdapter(
    private var currentUserStats: UserStats,
    private val statCosts: Map<String, StatCostConfig>,
    private val onUpgradeClick: (statType: String, cost: Int) -> Unit
) : RecyclerView.Adapter<UpgradeStatAdapter.UpgradeStatViewHolder>() {

    class UpgradeStatViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val statName: TextView = itemView.findViewById(R.id.text_view_stat_name)
        val currentLevel: TextView = itemView.findViewById(R.id.text_view_current_level)
        val upgradeCost: TextView = itemView.findViewById(R.id.text_view_upgrade_cost)
        val upgradeButton: Button = itemView.findViewById(R.id.button_upgrade_stat)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UpgradeStatViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_upgrade_stat, parent, false)
        return UpgradeStatViewHolder(view)
    }

    override fun onBindViewHolder(holder: UpgradeStatViewHolder, position: Int) {
        val statType = getStatType(position)
        val statValue = getStatValue(statType)
        val costConfig = statCosts[statType]

        if (costConfig != null) {
            val nextCost = calculateStatCost(statValue + 1, costConfig.baseCost, costConfig.growthRate)
            
            holder.statName.text = formatStatName(statType)
            holder.currentLevel.text = "Level: $statValue"
            holder.upgradeCost.text = "Cost: $nextCost Rubies"
            
            val canAfford = currentUserStats.rubies >= nextCost
            holder.upgradeButton.isEnabled = canAfford
            holder.upgradeButton.setOnClickListener {
                onUpgradeClick(statType, nextCost)
            }
        }
    }

    override fun getItemCount(): Int = statCosts.size

    private fun getStatType(position: Int): String {
        return statCosts.keys.toList()[position]
    }

    private fun getStatValue(statType: String): Int {
        return when (statType) {
            "attack_level" -> currentUserStats.attackLevel
            "attack_speed_level" -> currentUserStats.attackSpeedLevel
            "crit_chance_level" -> currentUserStats.critChanceLevel
            "crit_damage_level" -> currentUserStats.critDamageLevel
            else -> 0
        }
    }

    private fun calculateStatCost(currentLevel: Int, baseCost: Int, growthRate: Float): Int {
        // Matches backend calculation
        return (baseCost * Math.pow(growthRate.toDouble(), (currentLevel - 1).toDouble())).toInt()
    }

    private fun formatStatName(statType: String): String {
        return statType.replace("_level", "").replace("_", " ").split(' ').joinToString(" ") { it.capitalize() }
    }

    fun updateStats(newStats: UserStats) {
        this.currentUserStats = newStats
        notifyDataSetChanged()
    }
}