package com.onep.archiveeditor.ui.gacha

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.onep.archiveeditor.R
import com.onep.archiveeditor.data.model.ObtainedSkin
import com.onep.archiveeditor.data.model.SkinOption

class GachaSkinAdapter(private val skins: MutableList<ObtainedSkin>) : RecyclerView.Adapter<GachaSkinAdapter.GachaSkinViewHolder>() {

    class GachaSkinViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val skinArt: ImageView = itemView.findViewById(R.id.image_view_skin_art)
        val skinName: TextView = itemView.findViewById(R.id.text_view_skin_name)
        val skinGrade: TextView = itemView.findViewById(R.id.text_view_skin_grade)
        val skinOptions: TextView = itemView.findViewById(R.id.text_view_skin_options)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GachaSkinViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_gacha_skin, parent, false)
        return GachaSkinViewHolder(view)
    }

    override fun onBindViewHolder(holder: GachaSkinViewHolder, position: Int) {
        val skin = skins[position]

        // Placeholder for image loading. Will use Coil/Glide later.
        // holder.skinArt.load(skin.imageUrl)
        holder.skinArt.setImageResource(R.drawable.placeholder_skin) // Use a simple placeholder drawable for now

        holder.skinName.text = skin.name
        holder.skinGrade.text = "Grade: ${skin.grade}"
        holder.skinOptions.text = skin.options.joinToString("\n") { "${it.optionType}: ${String.format("%.2f", it.optionValue)}" }
    }

    override fun getItemCount(): Int = skins.size

    fun updateSkins(newSkins: List<ObtainedSkin>) {
        skins.clear()
        skins.addAll(newSkins)
        notifyDataSetChanged()
    }
}
