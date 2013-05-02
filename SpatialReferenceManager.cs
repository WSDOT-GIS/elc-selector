using System;
using System.Linq;
using System.Configuration;
using Esri.ArcGis.Soap;

namespace Wsdot.Gis
{
	/// <summary>
	/// A class used to get the correct type of <see cref="SpatialReference"/> decendent based on the WKID without
	/// calling a Geometry Server to do the lookup.
	/// </summary>
	public static class SpatialReferenceManager
	{
		/// <summary>
		/// WGS 84 spatial reference system.
		/// </summary>
		public const int WGS_84_SPATIAL_REFERENCE_SYSTEM_ID = 4326;

		// Retrieve lists of the projected and geographic CS WKIDs from the web.config file.
		private static int[] _projectedWkids = ConfigurationManager.AppSettings["ProjectedWkids"].ToInts();
		private static int[] _geographicWkids = ConfigurationManager.AppSettings["GeographicWkids"].ToInts();
		////private static int _defaultWkid = int.Parse(ConfigurationManager.AppSettings["DefaultSpatialReference"]);

		////private static int _sqlSR = int.Parse(ConfigurationManager.AppSettings["SqlSpatialReferenceWkid"]);

		/////// <summary>
		/////// The default spatial reference id (probably WGS_84 - id: 4326)
		/////// </summary>
		////public static int DefaultSpatialReferenceId { get { return _defaultWkid; } }

		/////// <summary>
		/////// The default spatial reference system
		/////// </summary>
		////public static SpatialReference DefaultSpatialReference { get { return DefaultSpatialReferenceId.ToSpatialReference(); } }
		/////// <summary>
		/////// The spatial reference that will be used when writing geometry data to a SQL Server database.
		/////// </summary>
		////public static int SqlSpatialReference { get { return _sqlSR; } }

		////public static int[] ProjectedWkids { get { return _projectedWkids; } }
		////public static int[] GeographicWkids { get { return _geographicWkids; } }

		/// <summary>
		/// Returns a <see cref="SpatialReference"/> object corresponding to the specified WKID.
		/// </summary>
		/// <param name="wkid">A Well-Known Identifier (WKID) for a spatial reference system.</param>
		/// <returns>
		/// <para>Returns a <see cref="SpatialReference"/> object corresponding to <paramref name="wkid"/>.</para>
		/// <para>
		/// If <paramref name="wkid"/> matches one of the values defined in web.config,
		/// either a <see cref="GeographicCoordinateSystem"/> or <see cref="ProjectedCoordinateSystem"/>
		/// is returned.  Otherwise a <see cref="UnknownCoordinateSystem"/> is returned.
		/// </para>
		/// </returns>
		public static SpatialReference ToSpatialReference(this int wkid)
		{
			SpatialReference sr;
			if (_projectedWkids.Contains(wkid))
			{
				sr = new ProjectedCoordinateSystem();
			}
			else if (_geographicWkids.Contains(wkid))
			{
				sr = new GeographicCoordinateSystem();
			}
			else
			{
				sr = new UnknownCoordinateSystem();
			}
			sr.WKID = wkid;
			sr.WKIDSpecified = true;
			return sr;
		}

		/// <summary>
		/// Converts a string containing a comma-separated list of integers into an array of <see cref="int"/> values.
		/// </summary>
		/// <param name="csvRow">A string containing a comma-separated list of integers</param>
		/// <returns>An array of <see cref="int"/> values.</returns>
		public static int[] ToInts(this string csvRow)
		{
			if (string.IsNullOrEmpty(csvRow))
			{
				return null;
			}
			return (from s in csvRow.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries) select int.Parse(s)).ToArray();
		}
	}
}
