package org.openstreetmap.josm.plugins.scripting.preferences;

import java.awt.GridBagConstraints;
import java.awt.Insets;

public class GridBagConstraintBuilder {
	
	private GridBagConstraints gbc = new GridBagConstraints();
	
	static public GridBagConstraintBuilder gbc() {
		return new GridBagConstraintBuilder();
	}
	
	public GridBagConstraintBuilder() {
		reset();
	}
	
	public GridBagConstraintBuilder reset() {
		gbc = new GridBagConstraints();
		gbc.gridheight = 1;
		gbc.gridwidth = 1;
		gbc.gridx = 0;
		gbc.gridy = 0;	
		gbc.fill  = GridBagConstraints.HORIZONTAL;
		gbc.anchor = GridBagConstraints.LINE_START;
		return this;
	}
	
	public GridBagConstraintBuilder gridx(int x){
		gbc.gridx = x;
		return this;
	}
	
	public GridBagConstraintBuilder gridy(int y){
		gbc.gridy = y;
		return this;
	}
	
	public GridBagConstraintBuilder cell(int x, int y){
		gbc.gridx  =x;
		gbc.gridy = y;
		return this;
	}
	
	public GridBagConstraintBuilder cell(int x, int y, int width, int height){
		gbc.gridheight = height;
		gbc.gridwidth = width;
		gbc.gridx = x;
		gbc.gridy = y;
		return this;
	}
	
	public GridBagConstraintBuilder weightx(double weightx){
		gbc.weightx = weightx;
		return this;
	}
	
	public GridBagConstraintBuilder weighy(double weighty){
		gbc.weighty = weighty;
		return this;
	}
	
	public GridBagConstraintBuilder weight(double weightx, double weighty){
		gbc.weightx  =weightx;
		gbc.weighty = weighty;
		return this;
	}
	
	public GridBagConstraintBuilder anchor(int anchor){
		gbc.anchor = anchor;
		return this;
	}
	
	public GridBagConstraintBuilder row(int y){
		gbc.gridx = 0;
		gbc.gridy = y;
		gbc.gridwidth = 1;
		gbc.gridheight = 1;
		gbc.weightx = 1.0;
		gbc.weighty = 0.0;
		return this;
	}
	
	public GridBagConstraintBuilder borderright(int space){
		if (gbc.insets == null) {
			gbc.insets = new Insets(0,0,0,0);
		}
		gbc.insets.right= space;
		return this;
	}
	
	public GridBagConstraints constraints() {
		return gbc;
	}
}
