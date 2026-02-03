package com.onep.archiveeditor.ui.library

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.onep.archiveeditor.R
import com.onep.archiveeditor.data.model.MonsterCodexEntry

class LibraryCodexAdapter(
    private val codexEntries: MutableList<MonsterCodexEntry>,
    private val onSubmitFragments: (monsterId: Int) -> Unit
) : RecyclerView.Adapter<LibraryCodexAdapter.CodexEntryViewHolder>() {

    class CodexEntryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val monsterSprite: ImageView = itemView.findViewById(R.id.image_view_monster_sprite)
        val monsterName: TextView = itemView.findViewById(R.id.text_view_monster_name)
        val fragmentsProgress: TextView = itemView.findViewById(R.id.text_view_fragments_progress)
        val completionStatus: TextView = itemView.findViewById(R.id.text_view_completion_status)
        val submitFragmentsButton: Button = itemView.findViewById(R.id.button_submit_fragments)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CodexEntryViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_codex_entry, parent, false)
        return CodexEntryViewHolder(view)
    }

    override fun onBindViewHolder(holder: CodexEntryViewHolder, position: Int) {
        val entry = codexEntries[position]

        // Placeholder for monster sprite loading. Will use Coil/Glide later.
        holder.monsterSprite.setImageResource(R.drawable.placeholder_monster) // Use a simple placeholder drawable for now

        holder.monsterName.text = "${entry.monsterName} (ID: ${entry.monsterId})"
        holder.fragmentsProgress.text = "Fragments: ${entry.collectedFragments}/${entry.requiredFragments}"
        holder.completionStatus.text = "Status: ${if (entry.isCompleted == 1) "Completed" else "In Progress"}"

        holder.submitFragmentsButton.isEnabled = (entry.isCompleted == 0) // Disable if completed
        holder.submitFragmentsButton.setOnClickListener {
            onSubmitFragments(entry.monsterId)
        }
    }

    override fun getItemCount(): Int = codexEntries.size

    fun updateCodexEntries(newEntries: List<MonsterCodexEntry>) {
        codexEntries.clear()
        codexEntries.addAll(newEntries)
        notifyDataSetChanged()
    }
}